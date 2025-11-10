import { useMantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export const useBreakpoint = () => {
    const theme = useMantineTheme();

    const isXs = useMediaQuery(`(min-width: ${theme.breakpoints.xs})`);
    const isSm = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);
    const isMd = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
    const isLg = useMediaQuery(`(min-width: ${theme.breakpoints.lg})`);
    const isXl = useMediaQuery(`(min-width: ${theme.breakpoints.xl})`);

    if (isXl) return 'xl';
    if (isLg) return 'lg';
    if (isMd) return 'md';
    if (isSm) return 'sm';
    if (isXs) return 'xs';
    return 'base';
};
