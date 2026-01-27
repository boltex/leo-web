import tseslint from 'typescript-eslint';

export default tseslint.config(
    // Base recommended rules
    tseslint.configs.recommended,

    // Type-aware rules
    tseslint.configs.recommendedTypeChecked,

    // Global ignores
    {
        // ignores: [
        //     'out',
        //     'dist',
        //     '**/*.d.ts',
        // ],
        ignores: ['**/*'], // comment this out to turn ESLint back on
    },

    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: import.meta.dirname,
                sourceType: 'module',
            },
        },

        rules: {
            // Naming freedom (Leo / Python heritage)
            '@typescript-eslint/naming-convention': 'off',

            // Style
            'semi': ['warn', 'always'],
            'curly': 'warn',
            'eqeqeq': 'warn',

            // Correctness
            '@typescript-eslint/strict-boolean-expressions': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',

            // Async discipline
            'require-await': 'error',
            'no-return-await': 'warn',

            // Error handling
            'no-throw-literal': 'warn',
        },
    }
);
