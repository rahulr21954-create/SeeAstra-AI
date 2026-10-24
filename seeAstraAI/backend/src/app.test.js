
import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "./app.js";

test("GET / returns backend status", async () => {
  const response = await request(app).get("/");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.name, "SeeAstra AI Backend");
});

test("Unknown API route returns JSON 404", async () => {
  const response = await request(app).get(
    "/api/route-that-does-not-exist"
  );

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "API endpoint not found");
});

test("Response does not expose X-Powered-By", async () => {
  const response = await request(app).get("/");

  assert.equal(response.headers["x-powered-by"], undefined);
});
