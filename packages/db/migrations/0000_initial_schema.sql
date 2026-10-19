CREATE TYPE "public"."channel_type" AS ENUM('telegram', 'discord', 'whatsapp_export');--> statement-breakpoint
CREATE TYPE "public"."marketplace" AS ENUM('shopee', 'mercadolivre', 'amazon');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('candidate', 'approved', 'rejected', 'published', 'expired');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('queued', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "channel_type" NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"min_interval_seconds" integer DEFAULT 900 NOT NULL,
	"max_posts_per_hour" integer DEFAULT 4 NOT NULL,
	"window_start" time DEFAULT '08:00:00' NOT NULL,
	"window_end" time DEFAULT '22:00:00' NOT NULL,
	CONSTRAINT "channels_interval_positive" CHECK ("channels"."min_interval_seconds" > 0),
	CONSTRAINT "channels_hour_limit_positive" CHECK ("channels"."max_posts_per_hour" > 0)
);
--> statement-breakpoint
CREATE TABLE "clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_link_id" uuid NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"referrer" text,
	"user_agent_hash" text,
	"ip_hash" text,
	CONSTRAINT "clicks_ip_hash_format" CHECK ("clicks"."ip_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "clicks_user_agent_hash_format" CHECK ("clicks"."user_agent_hash" ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marketplace" "marketplace" NOT NULL,
	"external_order_id" text NOT NULL,
	"product_ref" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"status" "offer_status" DEFAULT 'candidate' NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_score_range" CHECK ("offers"."score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"short_link_id" uuid,
	"text" text NOT NULL,
	"status" "post_status" DEFAULT 'queued' NOT NULL,
	"external_message_id" text,
	"error" text,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"price_cents" integer NOT NULL,
	"original_price_cents" integer,
	"currency" char(3) DEFAULT 'BRL' NOT NULL,
	"in_stock" boolean NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_history_price_nonnegative" CHECK ("price_history"."price_cents" >= 0),
	CONSTRAINT "price_history_original_nonnegative" CHECK ("price_history"."original_price_cents" >= 0),
	CONSTRAINT "price_history_currency_format" CHECK ("price_history"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marketplace" "marketplace" NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"url_canonical" text NOT NULL,
	"image_url" text,
	"category" text,
	"seller_name" text,
	"seller_rating" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_rating_range" CHECK ("products"."seller_rating" BETWEEN 0 AND 5)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"target_url" text NOT NULL,
	"product_id" uuid NOT NULL,
	"channel_id" uuid,
	"post_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "short_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_short_link_id_short_links_id_fk" FOREIGN KEY ("short_link_id") REFERENCES "public"."short_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_short_link_id_short_links_id_fk" FOREIGN KEY ("short_link_id") REFERENCES "public"."short_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "channels_type_name_unique" ON "channels" USING btree ("type","name");--> statement-breakpoint
CREATE INDEX "clicks_link_clicked_idx" ON "clicks" USING btree ("short_link_id","clicked_at");--> statement-breakpoint
CREATE INDEX "clicks_clicked_bot_idx" ON "clicks" USING btree ("clicked_at","is_bot");--> statement-breakpoint
CREATE UNIQUE INDEX "commissions_order_product_unique" ON "commissions" USING btree ("marketplace","external_order_id","product_ref");--> statement-breakpoint
CREATE INDEX "commissions_occurred_idx" ON "commissions" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "offers_status_score_idx" ON "offers" USING btree ("status","score");--> statement-breakpoint
CREATE INDEX "offers_product_idx" ON "offers" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_offer_channel_unique" ON "posts" USING btree ("offer_id","channel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_short_link_unique" ON "posts" USING btree ("short_link_id");--> statement-breakpoint
CREATE INDEX "posts_status_scheduled_idx" ON "posts" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "posts_channel_sent_idx" ON "posts" USING btree ("channel_id","sent_at");--> statement-breakpoint
CREATE INDEX "price_history_product_captured_idx" ON "price_history" USING btree ("product_id","captured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_marketplace_external_id_unique" ON "products" USING btree ("marketplace","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "short_links_post_unique" ON "short_links" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "short_links_product_idx" ON "short_links" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "short_links_channel_idx" ON "short_links" USING btree ("channel_id");