import assert from 'node:assert/strict';
import test from 'node:test';
import { catHome, guideCat, initialLife, layoutFor, neutral, nextLife, plane, poseAt, project, resident, shotFor, timing } from '../src/motion.ts';

test('core moves through the seven phases and returns to standby', () => {
  const sleep = initialLife(0);
  assert.equal(nextLife(sleep, 'tick', 500).phase, 'dormant');
  const standby = nextLife(sleep, 'tick', 1320);
  assert.equal(standby.phase, 'standby');
  const sensed = nextLife(standby, 'near', 1800);
  assert.equal(sensed.phase, 'sense');
  assert.strictEqual(nextLife(sensed, 'near', 1900), sensed);
  const curious = nextLife(sensed, 'tick', 1800 + timing.curiosity);
  assert.equal(curious.phase, 'curious');
  const awake = nextLife(curious, 'activate', 2700);
  assert.equal(awake.phase, 'awakening');
  assert.strictEqual(nextLife(awake, 'activate', 2900), awake);
  const resonance = nextLife(awake, 'resonate', 4300);
  assert.equal(resonance.phase, 'resonance');
  const recovery = nextLife(resonance, 'tick', 4300 + timing.resonance);
  assert.equal(recovery.phase, 'recover');
  assert.equal(nextLife(recovery, 'leave', 9000).near, false);
  assert.equal(nextLife(nextLife(recovery, 'leave', 9000), 'tick', 4300 + timing.resonance + timing.recover).phase, 'standby');
});

test('departure, idle sleep and a returning visitor', () => {
  const standby = nextLife(initialLife(0), 'tick', 1320);
  const wake = nextLife(standby, 'activate', 1950);
  assert.equal(nextLife(wake, 'depart', 2050).phase, 'recover');
  const later = 1320 + timing.restAfter;
  const resting = nextLife(standby, 'tick', later);
  assert.equal(resting.phase, 'dormant');
  assert.strictEqual(nextLife(resting, 'tick', later + 2000), resting);
  assert.equal(nextLife(resting, 'near', later + 2400).phase, 'sense');
});

test('interrupted flights start at the current pose and preserve depth ordering', () => {
  const layout = layoutFor(390, 844);
  const east = shotFor('laboratory', layout);
  const west = shotFor('archive', layout);
  assert.ok(east.x < 0 && west.x > 0);
  const halfway = poseAt(neutral, east, .54, .024);
  assert.deepEqual(poseAt(halfway, west, 0, .03), halfway);
  const end = poseAt(halfway, west, 1, .03);
  assert.ok(Math.abs(end.x - west.x) < .00001);
  assert.ok(plane(1.64, halfway, layout).scale > plane(.48, halfway, layout).scale);
  const platePoint = project([.554,.384], .78, halfway, layout);
  assert.ok(platePoint.every(Number.isFinite));
});

test('resident walks within the first ten seconds and guides from its present position', () => {
  assert.equal(resident(1, 'standby').phase, 'rest');
  const footstep = resident(5, 'standby');
  assert.equal(footstep.phase, 'walk');
  assert.ok(footstep.position[0] > catHome[0]);
  assert.equal(resident(11, 'standby').phase, 'watch');
  const guiding = guideCat(footstep.position, 100, 100, true);
  assert.deepEqual(guiding.position, footstep.position);
  const perched = guideCat(footstep.position, 100, 3300, true);
  assert.equal(perched.phase, 'watch');
  assert.equal(perched.position[0], .493);
});
