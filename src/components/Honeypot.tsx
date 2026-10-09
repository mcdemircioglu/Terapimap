/**
 * Bot tuzağı: ekran dışında, erişilebilirlik ağacında gizli, boş kalması
 * gereken alan. Değer okuma için bkz. readHoneypot.
 */
export function Honeypot() {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
    >
      <label>
        Şirket
        <input type="text" name="hp_company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

/** Submit handler'ında, ilk `await`tan ÖNCE çağırın (e.currentTarget sonra null olur). */
export function readHoneypot(form: Element | null | undefined): string {
  const el = form?.querySelector<HTMLInputElement>('input[name="hp_company"]');
  return el?.value ?? '';
}
