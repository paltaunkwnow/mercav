import { test } from "node:test";
import assert from "node:assert/strict";
import { formatLeakNotice, shouldNotifyNewLeaks } from "../new-leak-notice";

test("empty catalog never notifies, even if the first fill inserts rows", () => {
  assert.equal(shouldNotifyNewLeaks({ priorCount: 0, freshCount: 392 }), false);
});

test("a later consult notifies when the catalog already had data", () => {
  assert.equal(shouldNotifyNewLeaks({ priorCount: 120, freshCount: 3 }), true);
});

test("no notice when nothing new arrived", () => {
  assert.equal(shouldNotifyNewLeaks({ priorCount: 120, freshCount: 0 }), false);
  assert.equal(formatLeakNotice({ count: 0 }), null);
});

test("formats a single leak with a Bolivia cue", () => {
  const notice = formatLeakNotice({
    count: 1,
    samples: [{ title: "seprec.gob.bo: corporate data leak claimed by krybit", isBolivia: true }],
  });
  assert.equal(notice?.title, "Nueva filtración");
  assert.match(notice?.body ?? "", /seprec\.gob\.bo/);
  assert.match(notice?.body ?? "", /Bolivia/);
});

test("a large backlog is announced without listing the whole catalog as a count", () => {
  const notice = formatLeakNotice({
    count: 392,
    samples: [{ title: "seprec.gob.bo: corporate data leak claimed by krybit", isBolivia: true }],
  });
  assert.equal(notice?.title, "Filtraciones nuevas");
  assert.match(notice?.body ?? "", /seprec/);
  assert.doesNotMatch(notice?.title ?? "", /392/);
});
// creado por pato dev y askforvini
