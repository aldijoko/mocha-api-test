const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { expect } = require("chai");

const BASE_URL = "https://belajar-bareng.onrender.com";
const REPORT_DIR = path.join(__dirname, "..", "reports");

let token = "";
let username = "";
let startedAt = 0;
let testStartedAt = 0;
const results = [];

describe("API Automation Test", function () {
  this.timeout(60000);

  // Login sekali di awal; kalau gagal, seluruh suite berhenti (fail fast)
  before(async function () {
    startedAt = Date.now();
    const response = await request(BASE_URL).post("/api/login").send({ username: "admin", password: "admin" });
    expect(response.status, "Precondition login gagal").to.equal(200);
    expect(response.body.token, "Token tidak ditemukan").to.be.a("string").and.not.empty;
    token = response.body.token;
  });

  // Data test unik per skenario agar tidak bentrok antar test / antar run
  beforeEach(function () {
    testStartedAt = Date.now();
    username = `user${Date.now()}`;
  });

  // Catat hasil tiap skenario, detail error disimpan untuk debugging
  afterEach(function () {
    const { title, state, err } = this.currentTest;
    results.push({
      title,
      state: state || "pending",
      durationMs: Date.now() - testStartedAt,
      error: err ? err.message : null,
    });
  });

  // Tulis ringkasan hasil ke reports/api-test-result.json dan bersihkan state
  after(function () {
    const summary = {
      baseUrl: BASE_URL,
      executedAt: new Date(startedAt).toISOString(),
      totalDurationMs: Date.now() - startedAt,
      total: results.length,
      passed: results.filter((r) => r.state === "passed").length,
      failed: results.filter((r) => r.state === "failed").length,
      results,
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(path.join(REPORT_DIR, "api-test-result.json"), JSON.stringify(summary, null, 2));

    token = "";
    username = "";
  });

  it("POST Login - berhasil login dan menyimpan token", async function () {
    const response = await request(BASE_URL).post("/api/login").send({ username: "admin", password: "admin" });
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Login successful");
    expect(response.body.token).to.be.a("string").and.not.empty;

    token = response.body.token;
  });

  it("POST Login - negative case: password salah", async function () {
    const response = await request(BASE_URL).post("/api/login").send({ username: "admin", password: "salah" });
    expect(response.status).to.equal(401);
    expect(response.body.message).to.equal("Invalid username or password!");
  });

  it("POST Login - negative case: username dan password kosong", async function () {
    const response = await request(BASE_URL).post("/api/login").send({ username: "", password: "" });
    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal("Username or password is required");
  });

  it("POST Login - negative case: tanpa password", async function () {
    const response = await request(BASE_URL).post("/api/login").send({ username: "admin" });
    expect(response.status).to.equal(400);
    expect(response.body.message).to.equal("Username or password is required");
  });

  it("GET User - menampilkan daftar user", async function () {
    const response = await request(BASE_URL).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(response.status).to.equal(200);
    expect(response.body.users).to.be.an("array").that.is.not.empty;
    expect(response.body.users[0]).to.include.keys("userId", "username", "age");
  });

  it("POST Add User - positive case: data valid", async function () {
    const response = await request(BASE_URL).post("/api/add-user").set("Authorization", `Bearer ${token}`).send({ username: username, age: 25 });
    expect(response.status).to.equal(201);
    expect(response.body.username).to.equal(username);
    expect(response.body.age).to.equal(25);
    expect(response.body.message).to.equal(`User successfully added, Hi ${username}!`);
  });

  it("POST Add User - negative case: tanpa username", async function () {
    const response = await request(BASE_URL).post("/api/add-user").set("Authorization", `Bearer ${token}`).send({ age: 25 });
    expect(response.status).to.equal(400);
    expect(response.body.error).to.equal("Missing username or age");
  });
});
