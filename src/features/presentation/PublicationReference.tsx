export default function PublicationReference({ postId }: { postId: string }) {
  const reference = postId === 'PUB-0012'
    ? { href: 'https://www.thebeatles.com/here-comes-sun-2019-mix', label: '🎧 Escuchar Here Comes the Sun · sitio oficial ↗' }
    : postId === 'PUB-0010'
      ? { href: 'https://www.penguinrandomhouse.com/books/319178/matilda-by-roald-dahl-illustrated-by-quentin-blake/9780142410370/', label: '📖 Conocer Matilda · editorial ↗' } : null
  return reference && <a href={reference.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, color: 'var(--primary)', fontSize: 14, fontWeight: 700 }}>{reference.label}</a>
}
