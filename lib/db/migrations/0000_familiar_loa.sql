CREATE TABLE "bilibili_history" (
	"id" bigint NOT NULL,
	"user_id" text NOT NULL,
	"business" text,
	"bvid" text,
	"cid" bigint,
	"title" text,
	"tag_name" text,
	"cover" text,
	"view_time" bigint,
	"uri" text,
	"author_name" text,
	"author_mid" bigint,
	"timestamp" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bilibili_history_id_user_id_pk" PRIMARY KEY("id","user_id")
);
