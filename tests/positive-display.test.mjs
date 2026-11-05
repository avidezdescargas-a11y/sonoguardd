import {test} from 'node:test';
import assert from 'node:assert/strict';
import {relativeIndex,fromRelativeIndex,positiveLabel,positiveUnit,historyLevel,displayHistoryText} from '../public/audio-display.js';
test('índice positivo no falsifica dB SPL',()=>{
  assert.equal(relativeIndex(-110),0);
  assert.equal(relativeIndex(0),100);
  assert.ok(relativeIndex(-33)>0);
  assert.equal(positiveUnit('dBFS'),'índice /100');
  assert.match(positiveLabel(-33,'dBFS'),/índice \/100/);
  assert.doesNotMatch(positiveLabel(-33,'dBFS'),/-33/);
  assert.equal(positiveLabel(76.4,'dB SPL est.'),'76.4 dB SPL est.');
  for(const v of [-110,-85,-35,-12,0])assert.ok(Math.abs(fromRelativeIndex(relativeIndex(v))-v)<1e-8);
  assert.match(historyLevel('-33.0 dBFS'),/índice \/100/);
  assert.doesNotMatch(displayHistoryText('Pico -29.4 dBFS'),/-29.4/);
});
