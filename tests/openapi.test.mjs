import test from 'node:test';
import assert from 'node:assert/strict';
import { openApiDocument } from '../dist/openapi.js';

test('OpenAPI document describes all learning module routes and JWT auth', () => {
  assert.equal(openApiDocument.openapi, '3.0.3');
  assert.ok(openApiDocument.paths['/apartments/{apartmentId}/reviews'].get);
  assert.ok(openApiDocument.paths['/apartments/{apartmentId}/reviews'].post);
  assert.ok(openApiDocument.paths['/apartments/{apartmentId}/reviews/me'].get.security);
  assert.ok(openApiDocument.paths['/apartments/{apartmentId}/reviews/summary'].get);
  assert.ok(openApiDocument.paths['/reviews/{reviewId}'].patch);
  assert.ok(openApiDocument.paths['/reviews/{reviewId}'].delete);
  assert.equal(openApiDocument.components.securitySchemes.bearerAuth.scheme, 'bearer');
});
