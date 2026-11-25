import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { readMailSettings } from '../email-delivery.ts'
import { startRuntime } from '../runtime-server.ts'
import type { RuntimeConfig } from '../runtime-config.ts'

test('Configuración de correo: archivo privado explícito y validación antes de abrir la base',async t=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'email-settings-')),data=join(directory,'private');await mkdir(data)
  const config:RuntimeConfig={policy:{mode:'production',publicOrigin:'https://cai.example.test',trustedProxy:'loopback'},host:'127.0.0.1',port:3297,dataDirectory:data,databasePath:join(data,'cai.sqlite')}
  const file=join(data,'smtp.json'),settings={host:'smtp.gmail.com',port:465,user:'sender@example.test',from:'sender@example.test',password:'Credencial ficticia de correo',publicOrigin:'https://cai.example.test'}
  await writeFile(file,JSON.stringify(settings))
  await t.test('sin archivo configurado no se activa el envío ni se leen credenciales',()=>{assert.equal(readMailSettings(config),undefined)})
  await t.test('acepta el archivo privado y no imprime ni devuelve valores al navegador',()=>{assert.deepEqual(readMailSettings({...config,mailConfigPath:file}),settings)})
  await t.test('rechaza archivos fuera de datos, ausentes, grandes y configuraciones inválidas',async()=>{
    const outside=join(directory,'outside.json'),large=join(data,'large.json'),invalid=join(data,'invalid.json');await writeFile(outside,JSON.stringify(settings));await writeFile(large,'x'.repeat(8193));await writeFile(invalid,JSON.stringify({...settings,password:'SECRETO\nNO_VALIDO'}))
    for(const path of [outside,large,invalid,join(data,'absent.json'),'relative.json'])assert.throws(()=>readMailSettings({...config,mailConfigPath:path}),error=>{assert.ok(error instanceof Error);assert.ok(!error.message.includes('SECRETO'));return true})
  })
  await t.test('un remitente mal configurado impide arrancar antes de crear o migrar SQLite',async()=>{
    await assert.rejects(startRuntime({...config,mailConfigPath:join(data,'absent.json')}),/archivo JSON privado/)
    await assert.rejects(stat(config.databasePath),{code:'ENOENT'})
  })
})
