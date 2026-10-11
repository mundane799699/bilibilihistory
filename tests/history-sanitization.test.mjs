import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitizeHistoryRecord } from "../lib/db/history-sanitization.ts";

test("removes NUL from every uploaded text column", () => {
  const cleaned = sanitizeHistoryRecord({
    id: 1,
    user_id: "test-user",
    business: "arc\u0000hive",
    bvid: "BV\u00001",
    title: "\u0000视频\u0000标题\u0000",
    tag_name: "标\u0000签",
    cover: "https://example.invalid/\u0000cover.jpg",
    uri: "https://example.invalid/\u0000video",
    author_name: "作\u0000者",
  });

  assert.deepEqual(cleaned, {
    id: 1,
    user_id: "test-user",
    business: "archive",
    bvid: "BV1",
    title: "视频标题",
    tag_name: "标签",
    cover: "https://example.invalid/cover.jpg",
    uri: "https://example.invalid/video",
    author_name: "作者",
  });
});

test("preserves Unicode, whitespace and literal escape text", () => {
  const title = "  中文🎵 e\u0301\n第二行\t\\u0000 ";
  assert.equal(sanitizeHistoryRecord({ id: 1, user_id: "test-user", title }).title, title);
});

test("preserves nulls, omitted fields, numeric values and timestamps", () => {
  const createdAt = new Date("2026-10-11T00:00:00Z");
  const record = {
    id: 1234567890123,
    user_id: "test-user",
    title: null,
    author_name: undefined,
    cid: null,
    author_mid: 0,
    view_at: 1791676800,
    timestamp: 1791676800000,
    created_at: createdAt,
  };

  assert.deepEqual(sanitizeHistoryRecord(record), record);
  assert.equal(sanitizeHistoryRecord(record).created_at, createdAt);
  assert.equal(Object.hasOwn(sanitizeHistoryRecord(record), "cover"), false);
});

test("does not change the input record and can run more than once", () => {
  const record = Object.freeze({ id: 1, user_id: "test-user", title: "视\u0000频" });
  const cleaned = sanitizeHistoryRecord(record);

  assert.equal(record.title, "视\u0000频");
  assert.equal(cleaned.title, "视频");
  assert.notEqual(cleaned, record);
  assert.deepEqual(sanitizeHistoryRecord(cleaned), cleaned);
});

test("keeps all 100 records when one title contains NUL", () => {
  const records = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    user_id: "test-user",
    title: i === 43 ? "异常\u0000标题" : `标题 ${i + 1}`,
  }));
  const cleaned = records.map(sanitizeHistoryRecord);

  assert.equal(cleaned.length, 100);
  assert.deepEqual(cleaned.map((record) => record.id), records.map((record) => record.id));
  assert.equal(cleaned[43].title, "异常标题");
  assert.equal(cleaned.some((record) => record.title.includes("\u0000")), false);
});
