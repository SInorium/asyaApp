import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="font-serif text-3xl">Такой страницы нет</h1>
      <Link href="/" className="underline">
        Вернуться в каталог
      </Link>
    </div>
  );
}
