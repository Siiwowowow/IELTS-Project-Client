export function getNextMockTestTitle(items: Array<{ title?: string | null }> = []) {
  const highestExplicitNumber = items.reduce((highest, item) => {
    const match = item.title?.trim().match(/^Mock Test\s*-?\s*(\d+)$/i);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `Mock Test-${Math.max(highestExplicitNumber, items.length) + 1}`;
}
