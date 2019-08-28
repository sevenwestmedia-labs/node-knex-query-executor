import spawn from 'cross-spawn'
import path from 'path'

test('Typescript', () => {
    const typescriptCompilation = spawn.sync('./node_modules/.bin/tsc', [
        '-p',
        path.resolve(__dirname, './type-safety-fixtures/testconfig.json'),
    ])

    const output = typescriptCompilation.stdout.toString()

    expect(output).toMatchSnapshot('Typescript expected failures')
})
