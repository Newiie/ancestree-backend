
const index = require("../index");
const request = require("supertest");
const express = require("express");
const app = express();


test("index route works", done => {
    request(app)
      .get("/")
      .expect("Content-Type", /json/)
      .expect({ name: "frodo" })
      .expect(200, done);
});
  