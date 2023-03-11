/*
 * Pure JavaScript XML parser
 * Scott Means
 * https://github.com/smeans/pjxml
 * MIT license
 * 
 * Forked
 * Igor Kolosov
 * https://github.com/ikq/pjxml
 * MIT license
 *
 * Modifications: 
 *  Converted to classes.
 *  XML whitespaces strings removed.
 *  select returns undefined if not found.
 *  Fixed empty content element parsing.
 */

class pjLexer {
  constructor(xml) {
    this.xml = xml;
    this.entities = { lt: '<', gt: '>', amp: '&', apos: '\'', quot: '"' };
    this.pos = 0;
    this.inDTD = false;
  }

  static escapeMap = { '<': 'lt', '>': 'gt', '&': 'amp', '\'': 'apos', '"': 'quot' };
  static escapeXML(s) { return s.replace(/([<>&'"])/g, (m, p1)=>{ return '&' + pjLexer.escapeMap[p1] + ';'; }); }
  static isSpace(ch) { return ' \t\n\r'.indexOf(ch) >= 0; }
  static isSpaces(s) { for (let c of s) { if (!pjLexer.isSpace(c)) return false; } return true; }
  static isMarkup(ch) { return '<>?!&='.indexOf(ch) >= 0; }
  read() { return this.pos < this.xml.length ? this.xml.charAt(this.pos++) : null; }
  peek() { return this.pos < this.xml.length ? this.xml.charAt(this.pos) : null; }
  consume(ch) { return this.peek() === ch ? this.read() : null; }
  eof() { return this.pos >= this.xml.length; }
  skip(cch) { this.pos = Math.min(this.xml.length, this.pos + cch); return this.eof(); }

  getEntity(entity) {
    if (entity.charAt(0) === '#') {
      let n = entity.charAt(1) === 'x' ? parseInt(entity.substring(2), 16) : parseInt(entity.substring(1));
      entity = String.fromCharCode(n);
    } else if (this.entities[entity]) {
      entity = this.entities[entity];
    }
    return entity;
  }

  replaceEntities(s) {
    return s.replace(/&([^;]*);/g, (m, p1)=>{ return this.getEntity(p1); });
  }

  nextChar() {
    if (this.pos >= this.xml.length)
      return null;
    let ch = this.read();
    if (ch === '&' || (this.inDTD && ch === '%')) {
      let er = '';
      while ((ch = this.read()) !== ';' && ch) {
        er += ch;
      }
      ch = this.getEntity(er);
    }
    return ch;
  }

  readString(cch) {
    let s = '', ch;
    while (s.length < cch && (ch = this.nextChar()))
      s += ch;
    return s.length > cch ? s.substring(0, cch) : s;
  }

  peekString(cch) {
    let ip = this.pos;
    let s = this.readString(cch);
    this.pos = ip;
    return s;
  }

  consumeString(s) {
    if (this.peekString(s.length) === s) {
      this.readString(s.length);
      return true;
    }
    return false;
  }

  consumeUntil(marker) {
    let s = '', ch;
    while (ch = this.nextChar()) {
      if (ch === marker.charAt(0) && this.consumeString(marker.substring(1))) {
        return s;
      }
      s += ch;
    }
    return s;
  }

  skipSpace() {
    while (pjLexer.isSpace(this.peek())) {
      this.read();
    }
  }

  readName() {
    let ch, name = '';
    while ((ch = this.peek()) && !(pjLexer.isSpace(ch) || pjLexer.isMarkup(ch) || ch === '/')) {
      name += this.read();
    }
    return name;
  }

  readQuotedString() {
    let ch, sd, s = '';
    sd = this.read();
    while ((ch = this.read()) && ch !== sd) {
      s += ch;
    }
    return s;
  }

  parseExternalID() {
    if (this.consumeString('SYSTEM')) {
      this.skipSpace();
      this.readString();
    } else if (this.consumeString('PUBLIC')) {
      this.skipSpace();
      this.readQuotedString();
      this.skipSpace();
      this.readQuotedString();
    }
  }

  parseEntityDecl() {
    this.skipSpace();
    if (this.peek() === '%') {
      this.read();
    }
    this.skipSpace();
    let n = this.readName();
    this.skipSpace();
    let v = this.replaceEntities(this.readQuotedString());
    this.consumeUntil('>');
    this.entities[n] = v;
  }

  parseDecl() {
    this.consumeString('<!');
    if (this.peek() === '[') {
      if (this.consumeString('[INCLUDE[')) {
        this.skipSpace();
        while (!this.consumeString(']]>')) {
          this.parseDecl();
          this.skipSpace();
        }
      } else {
        this.consumeUntil(']]>');
      }
    } else {
      if (this.consumeString('ENTITY')) {
        this.parseEntityDecl();
      } else {
        this.consumeUntil('>');
      }
    }
  }

  parseDTD() {
    this.inDTD = true;
    this.skipSpace();
    this.readName();
    this.skipSpace();
    this.parseExternalID();
    this.skipSpace();
    if (this.consumeString('>')) {
      this.inDTD = false;
      return;
    }
    if (!this.consumeString('[')) {
      this.consumeUntil('>');
      this.inDTD = false;
      return;
    }
    this.skipSpace()
    while (!this.consumeString(']')) {
      this.parseDecl();
      this.skipSpace();
    }
    this.consumeUntil('>');
    this.inDTD = false;
  }
}

class pjNode {
  static DOCUMENT_NODE = 1;
  static PROCESSING_INSTRUCTION_NODE = 2;
  static ELEMENT_NODE = 3;
  static COMMENT_NODE = 4;

  constructor(type) {
    this.type = type;
    if (type !== pjNode.ELEMENT_NODE) {
      this.content = [];
    }
  }

  append(o) {
    switch (typeof o) {
      case 'string': {
        if (this.content.length && typeof this.content[this.content.length - 1] === 'string') {
          this.content[this.content.length - 1] += o;
          return;
        }
      } break;
    }
    this.content.push(o);
    return this;
  }

  parse(lex) {
    let ch = '';
    let s = '';
    while (ch = lex.nextChar()) {
      if (ch === '<') {
        if (!pjLexer.isSpaces(s)) // remove whitespaces strings.
          this.append(s);
        s = '';
        ch = lex.nextChar();
        switch (ch) {
          case '!': {
            if (lex.consumeString('--')) {
              let cn = new pjNode(pjNode.COMMENT_NODE);
              cn.append(lex.consumeUntil('-->'));
              this.append(cn);
            } else if (lex.consumeString('[CDATA[')) {
              this.append(lex.consumeUntil(']]>'));
            } else if (lex.consumeString('DOCTYPE')) {
              lex.parseDTD();
            }
          } break;

          case '?': {
            let pn = new pjNode(pjNode.PROCESSING_INSTRUCTION_NODE);
            pn.append(lex.consumeUntil('?>'));
            this.append(pn);
          } break;

          case '/': {
            lex.consumeUntil('>');
            return;
          }

          default: {
            let en = new pjNode(pjNode.ELEMENT_NODE);
            en.name = ch + lex.readName();
            while ((ch = lex.peek()) && (ch !== '/' && ch !== '>')) {
              lex.skipSpace();
              let an = lex.readName();
              lex.consumeString('=');
              if (!en.attributes)
                en.attributes = {};
              en.attributes[an] = lex.replaceEntities(lex.readQuotedString());
              lex.skipSpace();
            }
            en.content = [];
            if (ch === '/') {
              lex.consumeString('/>');
            } else if (ch === '>') {
              lex.nextChar();
              en.parse(lex);
            }
            this.append(en);
          } break;
        }
      } else {
        s += ch;
      }
    }
    if (!pjLexer.isSpaces(s)) {
      this.append(s);
    }
  }

  select0(xpath) {
    if (!Array.isArray(xpath)) {
      xpath = xpath.replace('//', '/>').split('/');
      xpath = xpath.reduce((a, v) => {
        if (v) {
          a.push(v);
        }
        return a;
      }, []);
    }
    if (xpath.length === 0) {
      return [];
    }
    if (xpath[0].charAt(0) === '@') {
      return this.attributes ? [this.attributes[xpath[0].substr(1)]] : [];
    }

    let ra = [];
    let exp = xpath[0];
    let recurse = exp.charAt(0) === '>';
    let name = recurse ? exp.substr(1) : exp;

    let ea = this.elements(name);

    if (xpath.length > 1) {
      ea.map((el) => {
        ra = ra.concat(el.select0(xpath.slice(1)));
      });
    } else {
      ra = ra.concat(ea);
    }

    if (recurse) {
      this.elements().map((el) => {
        ra = ra.concat(el.select0(xpath));
      });
    }

    return ra.length === 1 ? ra[0] : ra;
  }

  select(xpath) {
    let ra = this.select0(xpath);
    return Array.isArray(ra) && ra.length === 0 ? undefined : ra;
  }

  emitContent(node, func) {
    let s = '';
    for (let i = 0; i < node.content.length; i++) {
      let o = node.content[i];

      if (typeof o === 'string') {
        s += pjLexer.escapeXML(o);
      } else {
        s += o[func]();
      }
    }
    return s;
  }

  firstElement() {
    for (let i = 0; i < this.content.length; i++) {
      let o = this.content[i];
      if (o instanceof pjNode && o.type === pjNode.ELEMENT_NODE) {
        return o;
      }
    }
    return null;
  }

  elements(name) {
    return this.content.reduce((ea, o) => {
      if (o instanceof pjNode && o.type === pjNode.ELEMENT_NODE && (!name || name === '*' || o.name == name)) {
        ea.push(o);
      }

      return ea;
    }, []);
  }

  text() { return this.emitContent(this, 'text'); }

  xml() {
    let s = '';
    switch (this.type) {
      case pjNode.ELEMENT_NODE:
        s += '<' + this.name;
        if (this.attributes) {
          for (let name in this.attributes) {
            if (this.attributes.hasOwnProperty(name)) {
              s += ' ' + name + '="' + pjLexer.escapeXML(this.attributes[name]) + '"';
            }
          }
        }
        if (this.content.length) {
          s += '>';
          s += this.emitContent(this, 'xml');
          s += '</' + this.name + '>';
        } else {
          s += '/>';
        }
        break;
      case pjNode.PROCESSING_INSTRUCTION_NODE:
        break;
      case pjNode.COMMENT_NODE:
        break;
      default:
        s = this.emitContent(this, 'xml');
        break;
    }
    return s;
  }
}

class pjXML {
  static parse(xml) {
    let lex = new pjLexer(xml);
    let doc = new pjNode(pjNode.DOCUMENT_NODE);
    doc.parse(lex);
    return doc;
  }
}