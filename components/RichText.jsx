import { Fragment } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Minimal inline formatter for AI replies.
//
// The model emits light markdown — **bold**, *italic*, `code`, the occasional
// dash list — and the chat bubble rendered it as a plain string, so people saw
// literal asterisks mid-conversation.
//
// This builds React elements rather than HTML. There is deliberately no
// dangerouslySetInnerHTML anywhere: model output is untrusted text, and the one
// thing worse than visible asterisks is an injection path into the page.
//
// It also has to cope with half-finished input, because the typewriter effect
// renders the reply one character at a time — an unmatched `**` must show as
// literal text, not swallow the rest of the message.
// ═══════════════════════════════════════════════════════════════════════════

// Order matters: ** before * so bold wins over italic.
const INLINE = [
  { re: /\*\*([^*]+)\*\*/,  tag: "strong" },
  { re: /(?<!\*)\*([^*\n]+)\*(?!\*)/, tag: "em" },
  { re: /`([^`\n]+)`/, tag: "code" },
];

function formatInline(text, keyPrefix) {
  for (const { re, tag } of INLINE) {
    const m = text.match(re);
    if (!m) continue;
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + m[0].length);
    const inner = m[1];
    const style = tag === "code"
      ? { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.92em",
          background: "rgba(40,28,16,0.06)", padding: "1px 5px", borderRadius: 5 }
      : undefined;
    const El = tag;
    return [
      ...formatInline(before, keyPrefix + "b"),
      <El key={keyPrefix + "m" + m.index} style={style}>{inner}</El>,
      ...formatInline(after, keyPrefix + "a"),
    ];
  }
  return text ? [text] : [];
}

const BULLET = /^\s*([-*•])\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,2})[.)]\s+(.*)$/;

export default function RichText({ text }) {
  if (!text) return null;

  const lines = String(text).split("\n");
  const out = [];
  let listBuf = [];
  let listKind = null;

  const flush = () => {
    if (!listBuf.length) return;
    const Tag = listKind === "ol" ? "ol" : "ul";
    out.push(
      <Tag key={"l" + out.length} style={{ margin: "6px 0", paddingLeft: 20 }}>
        {listBuf.map((item, i) => (
          <li key={i} style={{ marginBottom: 2 }}>{formatInline(item, `li${out.length}_${i}_`)}</li>
        ))}
      </Tag>
    );
    listBuf = [];
    listKind = null;
  };

  lines.forEach((line, i) => {
    const b = line.match(BULLET);
    const n = line.match(NUMBERED);
    if (b) {
      if (listKind === "ol") flush();
      listKind = "ul"; listBuf.push(b[2]); return;
    }
    if (n) {
      if (listKind === "ul") flush();
      listKind = "ol"; listBuf.push(n[2]); return;
    }
    flush();
    out.push(
      <Fragment key={"p" + i}>
        {formatInline(line, `p${i}_`)}
        {i < lines.length - 1 ? "\n" : null}
      </Fragment>
    );
  });
  flush();

  return <>{out}</>;
}
