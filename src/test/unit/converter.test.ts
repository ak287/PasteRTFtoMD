import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { convertToMarkdown } from '../../converter';

const options = {
  flavor: 'gfm' as const,
  preserveLineBreaks: false,
  enableTables: true
};

function readFixture(fileName: string): string {
  return fs.readFileSync(path.resolve(__dirname, '../../../test/fixtures', fileName), 'utf8');
}

describe('converter', () => {
  it('converts Word-style HTML to Markdown', () => {
    const html = readFixture('word.html');
    const markdown = convertToMarkdown({ mimeType: 'text/html', content: html }, options);

    assert.ok(markdown);
    assert.ok(markdown?.includes('# Weekly Status'));
    assert.ok(markdown?.includes('**bold**'));
    assert.ok(markdown?.includes('[reference link](https://example.com/reference)'));
    assert.ok(/-\s+First item/.test(markdown ?? ''));
    assert.ok(markdown?.includes('```'));
    assert.ok(markdown?.includes('| Name | Value |'));
    assert.ok(!markdown?.toLowerCase().includes('<script'));
  });

  it('converts nested browser list content', () => {
    const html = readFixture('google-docs.html');
    const markdown = convertToMarkdown({ mimeType: 'text/html', content: html }, options);

    assert.ok(markdown);
    assert.ok(markdown?.includes('## Notes'));
    assert.ok(/-\s+Parent bullet/.test(markdown ?? ''));
    assert.ok(markdown?.includes('Child bullet'));
  });

  it('sanitizes hostile links and script tags', () => {
    const html = '<p>Safe</p><a href="javascript:alert(1)">bad link</a><script>alert(1)</script>';
    const markdown = convertToMarkdown({ mimeType: 'text/html', content: html }, options);

    assert.ok(markdown);
    assert.ok(markdown?.includes('Safe'));
    assert.ok(markdown?.includes('[bad link](#)'));
    assert.ok(!markdown?.includes('alert(1)'));
  });

  it('converts RTF fallback to plain Markdown-safe text', () => {
    const rtf = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\pard\\b Hello\\b0\\par\\i World\\i0\\par}';
    const markdown = convertToMarkdown({ mimeType: 'text/rtf', content: rtf }, options);

    assert.ok(markdown);
    assert.ok(markdown?.includes('Hello'));
    assert.ok(markdown?.includes('World'));
  });

  it('preserves blockquote and heading from article HTML', () => {
    const html = readFixture('news-site.html');
    const markdown = convertToMarkdown({ mimeType: 'text/html', content: html }, options);

    assert.ok(markdown);
    assert.ok(markdown?.includes('# Market Wrap'));
    assert.ok(markdown?.includes('> The market closed higher'));
  });
});
