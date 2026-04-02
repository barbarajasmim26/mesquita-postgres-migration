CREATE TABLE "contratos" (
	"id" serial PRIMARY KEY NOT NULL,
	"propriedadeId" integer NOT NULL,
	"casa" varchar(50) NOT NULL,
	"nomeInquilino" text NOT NULL,
	"dataEntrada" timestamp,
	"dataSaida" timestamp,
	"caucao" numeric(10, 2),
	"aluguel" numeric(10, 2) NOT NULL,
	"diaPagamento" integer,
	"status" varchar(20) DEFAULT 'ativo',
	"telefone" varchar(20),
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "former_tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"nomeInquilino" text NOT NULL,
	"dataSaida" timestamp,
	"motivo" text,
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pagamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pendente',
	"valorPago" numeric(10, 2),
	"dataPagamento" timestamp,
	"observacao" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propriedades" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"endereco" text NOT NULL,
	"cidade" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"contratoId" integer NOT NULL,
	"ano" integer NOT NULL,
	"mes" integer NOT NULL,
	"status" varchar(20) DEFAULT 'vencido',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"templateId" integer NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"nomeArquivo" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nome" text NOT NULL,
	"cpf" varchar(20),
	"rg" varchar(20),
	"telefone" varchar(20),
	"email" varchar(320),
	"endereco" text,
	"profissao" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
