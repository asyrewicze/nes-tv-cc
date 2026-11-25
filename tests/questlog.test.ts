import { expect, test } from 'claude-code/testing'
import { commandGist, describe } from '../hooks/questlog'

test('shell commands show what they do, not setup or full paths', async () => {
  expect(commandGist('D=/Users/me/Documents/GitHub/nes-tv-cc; claude plugin validate $D')).toBe('claude plugin validate $D')
  expect(commandGist('cd /Users/me/Documents/GitHub/nes-tv-cc && git commit -q -m hi')).toBe('git commit -q -m hi')
  expect(commandGist('M=/a/b; F=$M/hooks/x.ts; sed -n 1,5p $F')).toBe('sed -n 1,5p $F')
  expect(commandGist('cat /Users/me/projects/app/src/index.ts')).toBe('cat index.ts')
  expect(commandGist('cd "/Users/me/My Folder" && ls -la ~/Documents/notes')).toBe('ls -la notes')
  expect(commandGist('export FOO=1 && npm test')).toBe('npm test')
  expect(commandGist('npm test')).toBe('npm test')
  expect(describe('Bash', { command: 'D=/Users/me/x; cd $D && git push -q' })).toBe('CASTS git push -q')
})
