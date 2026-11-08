import { describe, it, expect } from 'vitest';
import { isSupportedBrowser, SUPPORTED_MESSAGE } from '../src/logic/support.js';

const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const FIREFOX =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0';
const SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const OLD_IE =
  'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';

describe('isSupportedBrowser', () => {
  it('accepts desktop Chrome, Firefox and Safari with WebGL', () => {
    for (const userAgent of [CHROME, FIREFOX, SAFARI]) {
      expect(isSupportedBrowser({ userAgent, hasWebGL: true })).toBe(true);
    }
  });
  it('rejects a browser without WebGL', () => {
    expect(isSupportedBrowser({ userAgent: CHROME, hasWebGL: false })).toBe(
      false,
    );
  });
  it('rejects mobile browsers', () => {
    expect(isSupportedBrowser({ userAgent: IPHONE, hasWebGL: true })).toBe(
      false,
    );
  });
  it('rejects unknown browsers', () => {
    expect(isSupportedBrowser({ userAgent: OLD_IE, hasWebGL: true })).toBe(
      false,
    );
  });
  it('names the supported browsers in the message', () => {
    expect(SUPPORTED_MESSAGE).toContain('Chrome');
    expect(SUPPORTED_MESSAGE).toContain('Firefox');
    expect(SUPPORTED_MESSAGE).toContain('Safari');
  });
});
