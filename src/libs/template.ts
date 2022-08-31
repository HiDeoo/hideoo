import fs from 'node:fs/promises'
import path from 'node:path'

export async function compileTemplate(
  templateName: string,
  fileName: string,
  variables: Record<string, string | number>,
  outputPath = 'assets'
) {
  const template = await getSvgTemplate(path.join('templates', templateName))

  const compiledTemplate = template.replaceAll(/__(\w+)__/g, (_match, variable) => {
    const value = variables[variable]

    if (typeof value === 'undefined') {
      throw new TypeError(`Invalid template variable '${variable}'`)
    }

    return value.toString()
  })

  return fs.writeFile(path.join(outputPath, fileName), compiledTemplate)
}

function getSvgTemplate(templatePath: string) {
  return fs.readFile(templatePath, { encoding: 'utf8' })
}
