Native Usage
============

Sentry can process Minidumps created when the Electron process or one of its
renderers crashes. To do so, the SDK needs to upload those files once the
application restarts (or immediately for renderer crashes). All event meta data
including user information and breadcrumbs are included in these uploads.

Due to restrictions of macOS app sandboxing, native crashes cannot be collected
in Mac App Store builds. In this case, native crash handling will be disabled,
regardless of the ``enableNative`` setting.

.. admonition:: A Word on Data Privacy

    Minidumps are memory dumps of the process at the moment it crashes. As such,
    they might contain sensitive information on the target system, such as
    environment variables, local path names or maybe even in-memory
    representations of input fields including passwords. **Sentry does not store
    these memory dumps**. Once processed, they are removed immediately and all
    sensitive information is stripped from the resulting issues.

Uploading Debug Information
---------------------------

To allow Sentry to fully process native crashes and provide you with
symbolicated stack traces, you need to upload *Debug Information Files*
(sometimes also referred to as *Debug Symbols* or just *Symbols*).

Sentry Wizard creates a convenient ``sentry-symbols.js``
script that will upload the Electron symbols for you. After installing the SDK
and every time you upgrade the Electron version, run this script:

.. code-block:: sh

    $ node sentry-symbols.js

This script will download symbol archives for all platforms from the Electron
`releases page`_ and upload them to Sentry. If your app uses a custom Electron
fork or you simply prefer to upload them manually, you can do so with our CLI:

.. code-block:: sh

    $ export VERSION=v1.8.4
    $ sentry-cli upload-dif -t dsym electron-$VERSION-darwin-x64-dsym.zip
    $ sentry-cli upload-dif -t breakpad electron-$VERSION-linux-x64-symbols.zip
    $ sentry-cli upload-dif -t breakpad electron-$VERSION-win32-x64-symbols.zip
    $ sentry-cli upload-dif -t breakpad electron-$VERSION-win32-ia32-symbols.zip

Likewise, if your app uses custom native extensions or you wish to symbolicate
crashes from a spawned child process, upload its debug information manually
during your build or release process. For more information on uploading debug
information and their supported formats, see :ref:`sentry-cli-dif`.

Child Processes
---------------

The SDK relies on the `Electron CrashReporter`_ to generate the crash dumps. To
receive crash reports for child processes, you need to make sure the crash
reporter is activated by either the SDK or manually (see :ref:`below
<electron-native-manual>`).

An exception to this is *macOS*, where the crash reporter only needs to be
started in the main process and watches all its child processes. The SDK already
takes care of this difference, so there is no need to manually disable
``enableNative``.

For custom child processes, especially ones not written in JavaScript, you need
to integrate a library that can generate Minidumps. These are most notably
`Crashpad`_ and `Breakpad`_. Please refer to their respective documentation on
how to build and integrate them. Configure them with the following upload URL:

.. code-block:: text

    ___MINIDUMP_URL___

It currently not possible create breadcrumbs or other event meta data from
native code. This has to happen in JavaScript. Support for this is planned in
future releases.

.. _electron-native-manual:

Manual Crash Reporting
----------------------

You can also capture native crashes by starting the `Electron CrashReporter`_
manually. Sentry is able to provide symbolicated stack traces and show system
information, but no Electron-specific metadata, breadcrumbs or context
information will be present. This is useful in cases where you cannot use the
full Electron SDK:

.. code-block:: javascript

    const { crashReporter } = require('electron');
    crashReporter.start({
      companyName: 'YourCompany',
      productName: 'YourApp',
      ignoreSystemCrashHandler: true,
      submitURL: '___MINIDUMP_URL___'
    });

.. _releases page: https://github.com/electron/electron/releases/latest
.. _Crashpad: https://chromium.googlesource.com/crashpad/crashpad/
.. _Breakpad: https://chromium.googlesource.com/breakpad/breakpad
.. _Electron CrashReporter: https://electronjs.org/docs/api/crash-reporter
