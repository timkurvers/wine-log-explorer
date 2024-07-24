export const stripIndent = (strings: TemplateStringsArray, ...params: string[]) => {
  let source = strings.map((string: string, i: number) => `${string}${params[i] || ''}`).join('')

  // See: https://github.com/zspecza/common-tags/blob/master/src/stripIndentTransformer/stripIndentTransformer.js
  const match = source.match(/^[^\S\n]*(?=\S)/gm)
  const indent = match && Math.min(...match.map((el) => el.length))
  if (indent) {
    const regexp = new RegExp(`^.{${indent}}`, 'gm')
    source = source.replace(regexp, '')
  }

  // Strip leading whitespace and trailing tabs/spaces
  source = source.replace(/^\n+|[ \t]+$/g, '')

  return source
}
