declare module "nprogress" {
  const NProgress: {
    start: () => void;
    done: (force?: boolean) => void;
    inc: (amount?: number) => void;
    set: (percentage: number) => void;
    configure: (options: Record<string, string>) => void;
    status: null | number;
    remove: () => void;
    // ... thêm method khác nếu có
  };
  export default NProgress;
}
