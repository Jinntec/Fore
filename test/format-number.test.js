import { html, oneEvent, fixtureSync, expect } from '@open-wc/testing';

import '../index.js';
import { formatNumber } from '../src/functions/format-number.js';

describe('format-number', () => {
  it('formats with grouping and fraction digits', () => {
    expect(formatNumber(1234.5, '#,##0.00')).to.equal('1,234.50');
    expect(formatNumber(1234567.891, '#,###.#')).to.equal('1,234,567.9');
  });

  it('handles optional digits, percent and prefix/suffix', () => {
    expect(formatNumber(0.5, '#.##')).to.equal('.5');
    expect(formatNumber(0.256, '0%')).to.equal('26%');
    expect(formatNumber(12, '€#,##0.00 EUR')).to.equal('€12.00 EUR');
  });

  it('uses round-half-even and the negative sub-picture', () => {
    expect(formatNumber(2.5, '0')).to.equal('2');
    expect(formatNumber(3.5, '0')).to.equal('4');
    expect(formatNumber(-3, '#,##0')).to.equal('-3');
    expect(formatNumber(-3, '#,##0;(#,##0)')).to.equal('(3)');
  });

  it('is callable from XPath in a template expression', async () => {
    const el = await fixtureSync(html`
      <fx-fore>
        <fx-model>
          <fx-instance type="html">
            <data>
              <price>1234.5</price>
            </data>
          </fx-instance>
        </fx-model>
        <label>{format-number(price, '#,##0.00')}</label>
      </fx-fore>
    `);
    await oneEvent(el, 'refresh-done');

    expect(el.querySelector('label').innerText).to.equal('1,234.50');
  });
});
