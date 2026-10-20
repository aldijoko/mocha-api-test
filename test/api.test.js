const request = require("supertest");
const { expect } = require("chai");

const BASE_URL = "https://belajar-bareng.onrender.com";

let token = "";

describe("API Automation Test", function () {
  this.timeout(60000);

  it("POST Login - berhasil login dan menyimpan token", async function () {
    const response = await request(BASE_URL).post("/api/login").send({ username: "admin", password: "admin" });
    expect(response.status).to.equal(200);
    expect(response.body.message).to.equal("Login successful");
    expect(response.body.token).to.be.a("string").and.not.empty;

    token = response.body.token;
  });

  it("GET User - menampilkan daftar user", async function () {
    const response = await request(BASE_URL).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(response.status).to.equal(200);
    expect(response.body.users).to.be.an("array").that.is.not.empty;
    expect(response.body.users[0]).to.include.keys("userId", "username", "age");
  });

  it("POST Add User - positive case: data valid", async function () {
    const username = `user${Date.now()}`;
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
