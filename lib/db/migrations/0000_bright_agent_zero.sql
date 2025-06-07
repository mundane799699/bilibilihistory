CREATE TABLE "bilibili_history" (
	"id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"business" text NOT NULL,
	"bvid" text NOT NULL,
	"cid" bigint NOT NULL,
	"title" text NOT NULL,
	"tag_name" text,
	"cover" text,
	"view_time" bigint NOT NULL,
	"uri" text,
	"author_name" text,
	"author_mid" bigint,
	"timestamp" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bilibili_history_id_user_id_pk" PRIMARY KEY("id","user_id")
);
