/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)', '"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			body: ['var(--font-body)', '"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			display: ['var(--font-display)', '"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
  			brand: ['var(--font-brand)', '"Russo One"', 'sans-serif'],
  		},
  		/* ── Type Scale (14px root = 1rem) ──────────────────────────────── */
  		fontSize: {
  			/* Micro labels — badge texts, chart ticks */
  			'2xs': ['0.714rem', { lineHeight: '1rem',      letterSpacing: '0.02em' }], // 10px
  			/* Small labels — card meta, table headers, sub-labels */
  			'xs':  ['0.857rem', { lineHeight: '1.25rem',   letterSpacing: '0.01em' }], // 12px
  			/* Body small — secondary text, timestamps, tooltip */
  			'sm':  ['0.929rem', { lineHeight: '1.35rem',   letterSpacing: '0em'    }], // 13px
  			/* Body base (1rem = 14px) — default prose, form labels, table rows */
  			'base':['1rem',     { lineHeight: '1.5rem',    letterSpacing: '0em'    }], // 14px
  			/* Body lg — sub-headings, section intro text */
  			'lg':  ['1.143rem', { lineHeight: '1.75rem',   letterSpacing: '-0.01em'}], // 16px
  			/* XL — card value numbers, page sub-titles */
  			'xl':  ['1.286rem', { lineHeight: '1.75rem',   letterSpacing: '-0.01em'}], // 18px
  			/* 2XL — KPI numbers, large stats */
  			'2xl': ['1.571rem', { lineHeight: '2rem',      letterSpacing: '-0.02em'}], // 22px
  			/* 3XL — dashboard greeting, hero numbers */
  			'3xl': ['1.857rem', { lineHeight: '2.25rem',   letterSpacing: '-0.02em'}], // 26px
  			/* 4XL — page-level hero display */
  			'4xl': ['2.286rem', { lineHeight: '2.5rem',    letterSpacing: '-0.03em'}], // 32px
  			/* 5XL — splash / brand display */
  			'5xl': ['3rem',     { lineHeight: '1.1',       letterSpacing: '-0.03em'}], // 42px
  			/* 6XL — landing hero */
  			'6xl': ['3.857rem', { lineHeight: '1',         letterSpacing: '-0.04em'}], // 54px
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
