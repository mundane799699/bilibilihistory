CREATE TABLE "bilibili_history" (
	"id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"business" text,
	"bvid" text,
	"cid" bigint,
	"title" text,
	"tag_name" text,
	"cover" text,
	"view_at" bigint,
	"uri" text,
	"author_name" text,
	"author_mid" bigint,
	"timestamp" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bilibili_history_id_user_id_pk" PRIMARY KEY("id","user_id")
);
--> statement-breakpoint
CREATE INDEX "title_idx" ON "bilibili_history" USING btree ("title");--> statement-breakpoint
CREATE INDEX "view_at_idx" ON "bilibili_history" USING btree ("view_at");--> statement-breakpoint
CREATE INDEX "author_name_idx" ON "bilibili_history" USING btree ("author_name");--> statement-breakpoint
CREATE INDEX "tag_name_idx" ON "bilibili_history" USING btree ("tag_name");