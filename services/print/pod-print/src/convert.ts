//
// Copyright © 2024 Hanzo Industries Inc.
//
import mammoth from 'mammoth'

export async function convertToHtml (buffer: Buffer): Promise<string> {
  return (await mammoth.convertToHtml({ buffer })).value
}
