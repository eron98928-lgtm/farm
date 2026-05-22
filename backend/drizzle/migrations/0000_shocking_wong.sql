CREATE TYPE "public"."admin_action_type" AS ENUM('CREATE_MANGA', 'UPDATE_MANGA', 'DELETE_MANGA', 'BLOCK_USER', 'UNBLOCK_USER', 'VIEW_LOGS');--> statement-breakpoint
CREATE TYPE "public"."anomaly_type" AS ENUM('BRUTE_FORCE', 'SCRAPING', 'GEO_ANOMALY', 'PROFILE_CHANGE', 'SIGNUP_SPIKE');--> statement-breakpoint
CREATE TYPE "public"."chapter_frequency" AS ENUM('IMMEDIATE', 'DAILY', 'WEEKLY');--> statement-breakpoint
CREATE TYPE "public"."cpf_status" AS ENUM('REGULAR', 'PENDENTE', 'CANCELADA', 'NULA', 'FALECIDO');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('SENT', 'FAILED', 'BOUNCED');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('SIGNUP_CONFIRMATION', 'NEW_CHAPTER', 'SECURITY_ALERT', 'ACCOUNT_BLOCKED', 'WEEKLY_DIGEST');--> statement-breakpoint
CREATE TYPE "public"."manga_rating" AS ENUM('L', 'L10', 'L12', 'L14', 'L16', 'L18');--> statement-breakpoint
CREATE TYPE "public"."manga_status" AS ENUM('ongoing', 'completed', 'hiatus');--> statement-breakpoint
CREATE TYPE "public"."recommendation_type" AS ENUM('WEEKLY_DIGEST', 'NEW_CHAPTER', 'PERSONALIZED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."security_event_type" AS ENUM('RATE_LIMIT', 'SUSPICIOUS_LOGIN', 'SUSPICIOUS_SIGNUP', 'BOT_DETECTED', 'SCRAPING', 'BRUTE_FORCE');--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action_type" "admin_action_type" NOT NULL,
	"target_id" integer,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anomaly_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"ip_address" varchar(45),
	"anomaly_type" "anomaly_type" NOT NULL,
	"risk_points" integer NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" varchar(255) NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"manga_id" integer NOT NULL,
	"chapter_number" varchar(50) NOT NULL,
	"title" varchar(500),
	"pages" json NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cpf_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cpf_hash" varchar(255) NOT NULL,
	"status" "cpf_status" NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"api_response" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cpf_verifications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email_type" "email_type" NOT NULL,
	"recipient_email" varchar(320),
	"status" "email_status" NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mangas" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"description" text,
	"cover_image" varchar(1000),
	"status" "manga_status" DEFAULT 'ongoing' NOT NULL,
	"rating" "manga_rating" DEFAULT 'L12' NOT NULL,
	"genres" json,
	"author" varchar(255),
	"artist" varchar(255),
	"views" integer DEFAULT 0 NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mangas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "recommendation_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"manga_id" integer NOT NULL,
	"email_id" integer,
	"recommendation_type" "recommendation_type" NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" "security_event_type" NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_id" integer,
	"details" json,
	"blocked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"manga_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"manga_id" integer NOT NULL,
	"chapter_id" integer,
	"last_read_page" integer DEFAULT 0,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"new_chapter_notifications" boolean DEFAULT true NOT NULL,
	"new_chapter_frequency" "chapter_frequency" DEFAULT 'DAILY' NOT NULL,
	"security_alerts" boolean DEFAULT true NOT NULL,
	"weekly_digest" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_risk_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ip_address" varchar(45),
	"risk_score" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"blocked_until" timestamp,
	"reason" varchar(255),
	CONSTRAINT "user_risk_scores_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(256) NOT NULL,
	"name" text,
	"email" varchar(320),
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE INDEX "idx_chapter_manga" ON "chapters" USING btree ("manga_id","chapter_number");--> statement-breakpoint
CREATE INDEX "idx_manga_slug" ON "mangas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_manga_status" ON "mangas" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sec_ip" ON "security_events" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_sec_user" ON "security_events" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fav_unique" ON "user_favorites" USING btree ("user_id","manga_id");--> statement-breakpoint
CREATE INDEX "idx_history_user" ON "user_history" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "idx_users_clerk_id" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");