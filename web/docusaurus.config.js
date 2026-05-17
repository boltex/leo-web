// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

const organizationName = "boltex";
const projectName = "leo-web";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Leo-Web',
  tagline: 'Literate Editor with Outlines',
  favicon: 'img/favicon.ico',

  url: `https://${organizationName}.github.io`,
  baseUrl: `/${projectName}/`,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: organizationName, // Usually your GitHub org/user name.
  projectName: projectName, // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        gtag: {
          trackingID: 'G-KH6D1R9Q7Z', // TODO : USE ENV VARS FOR THIS !
        },
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: false,
        pages: false,
        // blog: {
        //   showReadingTime: true,
        //   feedOptions: {
        //     type: ['rss', 'atom'],
        //     xslt: true,
        //   },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/leoweb-social-card.png',
      navbar: {
        title: 'Leo-Web',
        hideOnScroll: true,
        logo: {
          alt: 'Leo-Web Logo',
          src: 'img/leoapp256px.png',
        },
        items: [
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'tutorialSidebar',
          //   position: 'left',
          //   label: 'Tutorial',
          // },
          {
            type: 'docSidebar',
            sidebarId: 'gettingStartedSidebar',
            position: 'left',
            label: 'Getting Started',
          },
          {
            type: 'docSidebar',
            sidebarId: 'usersGuideSidebar',
            position: 'left',
            label: 'User\'s Guide',
          },
          {
            type: 'docSidebar',
            sidebarId: 'advancedTopicsSidebar',
            position: 'left',
            label: 'Advanced Topics',
          },
          {
            type: 'docSidebar',
            sidebarId: 'appendicesSidebar',
            position: 'left',
            label: 'Appendices',
          },
          // { to: '/blog', label: 'Blog', position: 'left' },
          // {
          //   type: 'doc',
          //   docId: 'appendices/glossary',
          //   label: 'Glossary',
          //   position: 'right',
          // },
          {
            'aria-label': 'GitHub Repository',
            className: 'navbar--github-link',
            position: 'right',
            href: 'https://github.com/boltex/leo-web',
            title: "GitHub Repository"
          },
        ],
      },
      // announcementBar: {
      //   id: 'leo-web_available',
      //   content:
      //     'Leo-Web is now available in the VSCode marketplace, and in VSCodium\'s Open VSX Registry!',
      //   backgroundColor: '#fafbfc',
      //   textColor: '#091E42',
      //   isCloseable: false,
      // },
      footer: {
        // style: "dark", // Comment off for customized styles from custom.css
        links: [
          {
            title: 'Original Leo Editor',
            items: [
              {
                label: 'Leo’s Home Page',
                href: 'https://leo-editor.github.io/leo-editor/',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Leo’s Forum',
                href: 'https://groups.google.com/g/leo-editor',
              },
            ],
          },
          {
            title: 'More',
            items: [
              // {
              //   label: 'Blog',
              //   to: '/blog',
              // },
              {
                label: 'GitHub',
                href: 'https://github.com/boltex/leo-web',
              },
            ],
          },
          {
            title: 'About',
            items: [
              {
                label: 'Support Leo-Web',
                href: 'https://boltex.github.io',
              },
            ],
          },
        ],
        copyright: `Copyright © 1996-${new Date().getFullYear()} <a class="footer__link-item" href="https://github.com/edreamleo/" target="_blank" title="Edward K. Ream on Github">Edward K. Ream</a> and <a class="footer__link-item" href="https://github.com/boltex/" target="_blank" title="Félix Malboeuf on Github">Félix Malboeuf</a>.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.oneDark,
      },

      // RESTORE ALGOLIA WHEN WE GET A NEW API KEY FOR LEO-WEB ONCE THIS SITE IS LIVE
      // (ALSO USE ENV VARS FOR THE API KEY AND APP ID !)
      // See https://dashboard.algolia.com/account/application/new/configure?plan=v8.5-docsearch 

      // algolia: {
      //   // The application ID provided by Algolia
      //   appId: '',

      //   // Public API key: it is safe to commit it
      //   apiKey: '',

      //   indexName: '',

      //   // Optional: see doc section below
      //   contextualSearch: false,

      //   // Optional: Specify domains where the navigation should occur through window.location instead on history.push.
      //   // Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
      //   // externalUrlRegex: 'external\\.com|domain\\.com',

      //   // Optional: Replace parts of the item URLs from Algolia. Useful when using the same search index for multiple deployments using a different baseUrl.
      //   // You can use regexp or string in the `from` param. For example: localhost:3000 vs myCompany.com/docs
      //   // replaceSearchResultPathname: {
      //   //   from: '/docs/', // or as RegExp: /\/docs\//
      //   //   to: '/',
      //   // },

      //   // Optional: Algolia search parameters
      //   searchParameters: {},

      //   // Optional: path for search page that enabled by default (`false` to disable it)
      //   searchPagePath: 'search',

      //   // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      //   insights: false,
      // }

    }),
  customFields: {
  }
};

export default config;
