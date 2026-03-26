export function getSoftCardShadowStyle(shadowColor: string) {
  return {
    shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  } as const;
}
