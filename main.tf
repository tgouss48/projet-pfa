provider "aws" {
  region = "us-east-1"
}

# Créer un VPC personnalisé
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# Créer deux subnets dans le VPC
resource "aws_subnet" "main" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
}

data "aws_availability_zones" "available" {}

# IAM Role pour ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [ {
      Action = "sts:AssumeRole",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      },
      Effect = "Allow"
    }]
  })
}

# Ajout de la politique spécifique pour accéder à AWS Secrets Manager
resource "aws_iam_role_policy" "ecs_task_secrets_policy" {
  name   = "ecs-task-secrets-policy"
  role   = aws_iam_role.ecs_task_execution_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "secretsmanager:GetSecretValue",
        Resource = aws_secretsmanager_secret.github_token.arn
      }
    ]
  })
}

# Attach IAM Policy pour ECS Task Execution
resource "aws_iam_role_policy_attachment" "ecs_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "my-ecs-cluster"
}

# Sécurité - Groupe pour ECS
resource "aws_security_group" "ecs_sg" {
  name        = "ecs-sg"
  description = "Allow HTTP access"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3000
    to_port     = 3004
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

locals {
  apps = [
    {
      name   = "auth-api"
      port   = 3000
      image  = "ghcr.io/tgouss48/auth-api:latest"
      expose = true
    },
    {
      name   = "upload-api"
      port   = 3001
      image  = "ghcr.io/tgouss48/upload-api:latest"
      expose = true
    },
    {
      name   = "recommend-api"
      port   = 3002
      image  = "ghcr.io/tgouss48/recommend-api:latest"
      expose = true
    },
    {
      name   = "frontend-app"
      port   = 3004
      image  = "ghcr.io/tgouss48/frontend-app:latest"
      expose = true
    },
    {
      name   = "scrap-service"
      port   = 0
      image  = "ghcr.io/tgouss48/scrap-service:latest"
      expose = false
    }
  ]
}

# ECS Task Definitions

resource "aws_secretsmanager_secret" "github_token" {
  name = "github-pat-token"
}

resource "aws_secretsmanager_secret_version" "github_token_version" {
  secret_id     = aws_secretsmanager_secret.github_token.id
  secret_string = jsonencode({ token = "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" })
}

resource "aws_ecs_task_definition" "tasks" {
  for_each = { for app in local.apps : app.name => app }

  family                   = each.value.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([ 
  merge({
    name      = each.value.name,
    image     = each.value.image,
    essential = true,
    environment = [
      { name = "MONGO_URI",         value = "mongodb+srv://JobDB:1605@jobapp.jdgud85.mongodb.net/JobDB?retryWrites=true&w=majority" },
      { name = "POSTGRES_HOST",     value = "jobdb.c8vo804cok9w.us-east-1.rds.amazonaws.com" },
      { name = "POSTGRES_USER",     value = "jobdb" },
      { name = "POSTGRES_PASSWORD", value = "E2E803C5CC" },
      { name = "POSTGRES_DB",       value = "jobdb" },
      { name = "POSTGRES_PORT",     value = "5432" }
    ],
    secrets = [
      {
        name      = "GHCR_TOKEN",
        valueFrom = aws_secretsmanager_secret.github_token.arn
      }
    ]
  },
  each.value.expose ? {
    portMappings = [ {
      containerPort = each.value.port,
      hostPort      = each.value.port,
      protocol      = "tcp"
    } ]
  } : {}
  )
])
}

# ECS Service

resource "aws_ecs_service" "services" {
  for_each = {
    for app in local.apps : app.name => app
    if app.expose
  }

  name            = each.value.name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.tasks[each.key].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.main[*].id
    assign_public_ip = true
    security_groups  = [aws_security_group.ecs_sg.id]
  }
}

# =========================
# SCRAP SERVICE - Planifié
# =========================

resource "aws_cloudwatch_event_rule" "scrap_schedule" {
  name                = "scrap-daily"
  description         = "Run scrap-service daily at 2am"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "scrap_task" {
  rule = aws_cloudwatch_event_rule.scrap_schedule.name
  arn  = aws_ecs_cluster.main.arn  # Assure-toi de passer l'ARN du cluster ECS, pas celui de la tâche

  role_arn = aws_iam_role.eventbridge_invoke_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.tasks["scrap-service"].arn  # Assure-toi que c'est bien l'ARN complet ici
    launch_type         = "FARGATE"
    network_configuration {
      subnets          = aws_subnet.main[*].id
      assign_public_ip = true
      security_groups  = [aws_security_group.ecs_sg.id]
    }
  }
}

resource "aws_iam_role" "eventbridge_invoke_ecs" {
  name = "eventbridge_invoke_ecs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [ {
      Effect = "Allow",
      Principal = {
        Service = "events.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "eventbridge_policy" {
  name = "eventbridge-policy"
  role = aws_iam_role.eventbridge_invoke_ecs.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [ {
      Effect = "Allow",
      Action = [
        "ecs:RunTask",
        "iam:PassRole"
      ],
      Resource = "*"
    }]
  })
}
