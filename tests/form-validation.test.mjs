import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  validateCertificateCode,
  validateEmail,
  validateName,
  validateOtp,
  validatePhone,
  validateUsername,
} from "../src/lib/form-validation.ts";

test("validates Vietnamese names and common account fields", () => {
  assert.equal(validateName("Nguyễn", "Họ"), "");
  assert.equal(validateName("Anne-Marie", "Tên"), "");
  assert.match(validateName("Nguyễn123", "Họ"), /chỉ được chứa/);
  assert.equal(validateEmail("student@example.com"), "");
  assert.match(validateEmail("student@invalid"), /không đúng định dạng/);
  assert.equal(validateUsername("student_01"), "");
  assert.match(validateUsername("học viên"), /chữ cái không dấu/);
});

test("validates and normalizes Vietnamese mobile numbers", () => {
  assert.equal(validatePhone("0912345678"), "");
  assert.equal(validatePhone("+84 912 345 678"), "");
  assert.equal(validatePhone(""), "");
  assert.match(validatePhone("0212345678"), /không hợp lệ/);
  assert.match(validatePhone("09123"), /không hợp lệ/);
  assert.equal(normalizePhone("+84 912-345-678"), "0912345678");
});

test("requires exact OTP and certificate formats", () => {
  assert.equal(validateOtp("123456"), "");
  assert.match(validateOtp("12A456"), /6 chữ số/);
  assert.equal(validateCertificateCode("LMS-2026-A1B2C3D4"), "");
  assert.match(validateCertificateCode("CERT-123"), /không đúng định dạng/);
});
