'use client'

import { useState, useEffect } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function TemplateCompiler() {
  const [object, setObject] = useState('{\n  "name": "John",\n  "age": 30,\n  "items": ["apple", "banana", "orange"],\n  "status": "active"\n}')
  const [template, setTemplate] = useState('Hello {{name}}!\n\n#if age > 25\nYou are over 25.\n#else\nYou are 25 or younger.\n#endif\n\nYour items:\n#each items\n- {{this}}\n#endeach\n\n#case status\n#when "active"\nYour account is active.\n#when "inactive"\nYour account is inactive.\n#else\nUnknown status.\n#endcase')
  const [result, setResult] = useState('')

  useEffect(() => {
    try {
      const compiledTemplate = compileTemplate(JSON.parse(object), template)
      setResult(compiledTemplate)
    } catch (error) {
      setResult('Error: Invalid JSON or template')
    }
  }, [object, template])

  function compileTemplate(obj: any, tmpl: string): string {
    let result = tmpl

    // Handle #if blocks
    result = result.replace(/#if\s+(.+?)\s*\n([\s\S]*?)(?:#else\s*\n([\s\S]*?))?#endif/g, (_, condition, ifBlock, elseBlock = '') => {
      const evalCondition = new Function(...Object.keys(obj), `return ${condition}`)
      return evalCondition(...Object.values(obj)) ? ifBlock : elseBlock
    })

    // Handle #each blocks
    result = result.replace(/#each\s+(\w+)\s*\n([\s\S]*?)#endeach/g, (_, arrayName, block) => {
      const array = obj[arrayName]
      return Array.isArray(array) ? array.map(item => compileTemplate({ ...obj, this: item }, block)).join('') : ''
    })

    // Handle #case blocks
    result = result.replace(/#case\s+(\w+)\s*\n([\s\S]*?)#endcase/g, (_, variable, block) => {
      const value = obj[variable]
      const cases = block.match(/#when\s+(.+?)\s*\n([\s\S]*?)(?=(?:#when|#else|$))/g) || []
      const defaultCase = block.match(/#else\s*\n([\s\S]*?)$/)?.[1] || ''

      for (const caseBlock of cases) {
        const [, caseValue, caseContent] = caseBlock.match(/#when\s+(.+?)\s*\n([\s\S]*)/) || []
        if (value == caseValue.replace(/^["']|["']$/g, '')) {
          return caseContent.trim()
        }
      }
      return defaultCase.trim()
    })

    // Replace {{variables}}
    result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => obj[key])

    return result
  }

  return (
    <div className="min-h-screen text-gray-100 p-8 space-y-8">
      <Card className="bg-neutral-900 text-neutral-100">
        <CardHeader>
          <CardTitle>Template Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>#each:</strong> Iterate over an array. Usage: <code>#each arrayName ... #endeach</code></li>
            <li><strong>#if:</strong> Conditional block. Usage: <code>#if condition ... #else ... #endif</code></li>
            <li><strong>#case:</strong> Switch statement. Usage: <code>#case variable #when value ... #else ... #endcase</code></li>
            <li><strong>Variables:</strong> Access object properties using <code>&#123;&#123;variableName&#125;&#125;</code></li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 text-neutral-100">
        <CardHeader>
          <CardTitle>Template Compiler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="object">TypeScript Object (JSON)</Label>
            <Textarea
              id="object"
              value={object}
              onChange={(e) => setObject(e.target.value)}
              className="font-mono bg-neutral-700 text-neutral-100"
              rows={10}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template">Template</Label>
            <Textarea
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="font-mono bg-neutral-700 text-neutral-100"
              rows={10}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="result">Result</Label>
            <Textarea
              id="result"
              value={result}
              readOnly
              className="font-mono bg-neutral-700 text-neutral-100"
              rows={10}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}