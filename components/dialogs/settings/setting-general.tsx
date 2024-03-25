import ThemeSwitch from '@/components/theme-switch';

export default function Setting(): React.ReactNode {
  return (
    <div>
      <h2 className="text-base font-semibold leading-7  border-b border-gray-200">表示</h2>
      <ul role="list" className="mt-2 divide-y divide-gray-100 text-sm leading-6">
        <li className="flex justify-between gap-x-2 py-2">
          <div className="font-medium">テーマ</div>
          <ThemeSwitch />
        </li>
      </ul>
    </div>
  );
}
