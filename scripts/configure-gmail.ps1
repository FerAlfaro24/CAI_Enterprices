param(
  [Parameter(Mandatory=$true)][string]$OutputFile,
  [Parameter(Mandatory=$true)][string]$Email,
  [Parameter(Mandatory=$true)][string]$PublicOrigin
)
$ErrorActionPreference = 'Stop'
$targetFile = [System.IO.Path]::GetFullPath($OutputFile)
if (Test-Path -LiteralPath $targetFile) { throw 'El archivo ya existe. Se conserva; usa un destino nuevo para no reemplazar credenciales.' }
if ($Email -notmatch '^[a-zA-Z0-9._%+-]+@gmail\.com$') { throw 'Indica la cuenta Gmail institucional.' }
if ($PublicOrigin -notmatch '^(https://[a-zA-Z0-9.-]+|http://localhost:[0-9]+)$') { throw 'Usa un origen HTTPS o localhost con puerto, sin rutas.' }
$parentDirectory = [System.IO.Path]::GetDirectoryName($targetFile)
if (-not (Test-Path -LiteralPath $parentDirectory -PathType Container)) { throw 'La carpeta privada de destino debe existir.' }
Write-Host 'Configurar correo de CAI. No se enviaran mensajes en este paso.'
Write-Host 'Pega la CONTRASENA DE APLICACION de Google (16 letras); no tu contrasena habitual.'
$secureValue = Read-Host 'Credencial de aplicacion' -AsSecureString
$credentialPointer = [System.IntPtr]::Zero
try {
  $credentialPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  $appCredential = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($credentialPointer) -replace '\s',''
  if ($appCredential -notmatch '^[a-zA-Z]{16}$') { throw 'Se esperan las 16 letras de la contrasena de aplicacion de Google. No se guardo nada.' }
  $jsonValue = @{host='smtp.gmail.com';port=465;user=$Email;from=$Email;password=$appCredential;publicOrigin=$PublicOrigin} | ConvertTo-Json
  $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($jsonValue)
  $stream = [System.IO.File]::Open($targetFile,[System.IO.FileMode]::CreateNew,[System.IO.FileAccess]::Write,[System.IO.FileShare]::None)
  try { $stream.Write($bytes,0,$bytes.Length) } finally { $stream.Dispose() }
  Write-Host 'Configuracion guardada en el archivo privado indicado. No se enviaron correos.'
} finally {
  if ($credentialPointer -ne [System.IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($credentialPointer) }
  $appCredential = $null; $jsonValue = $null; $secureValue.Dispose()
}
