import { DiagnosticCategory } from './diagnostics';
import * as config from './ProjectConfiguration';

const mockUUID = '672bc0d9-624c-4ea9-b08f-a4c05f552031';
const validPermission = 'access_location';
const invalidPermission = 'invalid';

it('validates the length of the app display name', () => {
  const configFile: any = {
    appDisplayName: 'The quick brown fox jumped over the lazy dog',
  };
  expect(config.validateProjectDisplayName(configFile).diagnostics[0]).toEqual(
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: `Display name must not exceed ${config.MAX_DISPLAY_NAME_LENGTH} characters`,
    }));
});

it('validates the app display name is not empty', () => {
  const configFile: any = {
    appDisplayName: '',
  };
  expect(config.validateProjectDisplayName(configFile).diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Display name must not be blank',
    }));
});

it('allows app display names of acceptable length', () => {
  const configFile: any = {
    appDisplayName: 'My App',
  };
  expect(config.validateProjectDisplayName(configFile).diagnostics).toHaveLength(0);
});

it('validates the app type is not an invalid app type', () => {
  const configFile: any = {
    appType: 'invalid',
  };
  expect(config.validateAppType(configFile).diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'App type \'invalid\' is invalid, expected app or clockface',
    }));
});

it('validates app is a valid app type', () => {
  const configFile: any = {
    appType: config.AppType.APP,
  };
  expect(config.validateAppType(configFile).diagnostics).toHaveLength(0);
});

it('validates clockface is a valid app type', () => {
  const configFile: any = {
    appType: config.AppType.CLOCKFACE,
  };
  expect(config.validateAppType(configFile).diagnostics).toHaveLength(0);
});

it('does not validate wipe color is invalid if app type is clockface', () => {
  const configFile: any = {
    appType: config.AppType.CLOCKFACE,
    wipeColor: 'invalid',
  };
  expect(config.validateWipeColor(configFile).diagnostics).toHaveLength(0);
});

it('does not validate wipe color existence if app type is clockface', () => {
  const configFile: any = {
    appType: config.AppType.CLOCKFACE,
  };
  expect(config.validateWipeColor(configFile).diagnostics).toHaveLength(0);
});

it('validates the requested permissions are valid', () => {
  const configFile: any = {
    requestedPermissions: [invalidPermission],
  };
  expect(config.validateRequestedPermissions(configFile).diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Warning,
      messageText: `One or more requested permissions was invalid: ${invalidPermission}`,
    }));
});

it('does not produce a validation warning for restricted permissions', () => {
  const configFile: any = {
    requestedPermissions: ['fitbit_token'],
  };
  expect(config.validateRequestedPermissions(configFile).diagnostics).toHaveLength(0);
});

it('validates the requested permissions are not duplicated', () => {
  const configFile: any = {
    requestedPermissions: [
      validPermission,
      validPermission,
      validPermission,
    ],
  };
  expect(config.validateRequestedPermissions(configFile).diagnostics[0]).toEqual(
    expect.objectContaining({
      category: DiagnosticCategory.Warning,
      // tslint:disable-next-line:max-line-length
      messageText: `One or more requested permissions was specified multiple times: ${validPermission}`,
    }));
});

it('reports the correct validation warning for both invalid and non-string permissions', () => {
  const configFile: any = {
    requestedPermissions: [
      validPermission,
      invalidPermission,
      123,
      null,
    ],
  };
  expect(config.validateRequestedPermissions(configFile).diagnostics).toEqual([
    expect.objectContaining({
      category: DiagnosticCategory.Warning,
      messageText: `One or more requested permissions was invalid: ${invalidPermission}`,
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'One or more requested permissions was not a string: 123, null',
    }),
  ]);
});

it.each([
  ['a number', 3.14],
  ['an array', ['foo', 'bar']],
  ['null', null],
  ['a boolean', true],
])('reports a validation warning if requested permissions includes %s', (_, vector) => {
  const configFile: any = {
    requestedPermissions: [
      vector,
    ],
  };
  expect(config.validateRequestedPermissions(configFile).diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: `One or more requested permissions was not a string: ${vector}`,
    }));
});

it('validates the supported locales are valid', () => {
  const configFile: any = {
    i18n: { invalid: { name: 'foo' } },
  };
  expect(config.validateSupportedLocales(configFile).diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Warning,
      messageText: 'Invalid locales: invalid',
    }));
});

it('validates the length of the localized display name', () => {
  const configFile: any = {
    i18n: {
      fr: { name: 'The quick brown fox jumped over the lazy dog' },
    },
  };
  expect(config.validateLocaleDisplayName(configFile, 'fr').diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Error,
      // tslint:disable-next-line:max-line-length
      messageText: `Localized display name for French must not exceed ${config.MAX_DISPLAY_NAME_LENGTH} characters`,
    }));
});

it('validates the localized app display name is not empty', () => {
  const configFile: any = {
    i18n: {
      fr: { name: '' },
    },
  };
  expect(config.validateLocaleDisplayName(configFile, 'fr').diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Localized display name for French must not be blank',
    }));
});

it('validates multiple localized display names', () => {
  const configFile: any = {
    appType: config.AppType.CLOCKFACE,
    i18n: {
      fr: { name: '' },
      it: { name: '' },
    },
  };

  expect(config.validateLocaleDisplayNames(configFile).diagnostics).toEqual([
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Localized display name for French must not be blank',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Localized display name for Italian must not be blank',
    }),
  ]);
});

it('does not complain if appUUID is any canonical-format UUID string', () => {
  expect(config.validateAppUUID({
    appUUID: '00000000-0000-0000-0000-000000000000',
  } as any).diagnostics)
    .toHaveLength(0);
});

it('validationErrors() validates all fields', () => {
  const configFile: any = {
    appUUID: 'invalid',
    appDisplayName: '',
    buildTargets: [],
    wipeColor: 'invalid',
    appType: 'invalid',
    requestedPermissions: [invalidPermission, validPermission],
    i18n: {
      en: { name: '' },
      invalid: { name: 'foo' },
      fr: { name: '' },
    },
  };
  expect(config.validate(configFile).diagnostics).toEqual([
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'appUUID must be a valid UUID, run "npx fitbit-build generate-appid" to fix',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Display name must not be blank',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'App type \'invalid\' is invalid, expected app or clockface',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Wipe color must be a valid hex color',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Warning,
      messageText: `One or more requested permissions was invalid: ${invalidPermission}`,
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'At least one build target must be enabled',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Warning,
      messageText: 'Invalid locales: invalid',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Localized display name for English must not be blank',
    }),
    expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'Localized display name for French must not be blank',
    }),
  ]);
});

it('validates all specified build targets are known', () => {
  const configFile: any = {
    buildTargets: ['__always_unknown__'],
  };
  expect(config.validateBuildTarget(configFile).diagnostics[0])
    .toEqual(expect.objectContaining({
      category: DiagnosticCategory.Error,
      messageText: 'One or more build targets was invalid: __always_unknown__',
    }));
});

describe('normalizeProjectConfig', () => {
  it.each([
    ['a number', 3.14],
    ['an array', ['foo', 'bar']],
    ['null', null],
    ['a boolean', true],
    ['a string', 'fail'],
  ])('throws a TypeError if the config JSON root is %s', (_, configData) => {
    expect(() => config.normalizeProjectConfig(configData)).toThrow(TypeError);
  });

  it.each([
    ['a number', 3.14],
    ['an object', { foo: 'bar' }],
    ['null', null],
    ['a boolean', true],
    ['a string', 'fail'],
  ])('throws a TypeError if requestedPermissions is %s', (_, requestedPermissions) => {
    expect(() => config.normalizeProjectConfig({ fitbit: { requestedPermissions } }))
      .toThrow(TypeError);
  });

  it('generates a new UUID if there is not one in the file', () => {
    const configFile = config.normalizeProjectConfig({}, { appUUID: mockUUID });
    expect(configFile.appUUID).toEqual(mockUUID);
  });

  it('does not generate a new UUID if one exists already', () => {
    const expectedUUID = 'd3f0198c-865c-4b62-8630-91d1480089fb';
    const configFile = config.normalizeProjectConfig({
      fitbit: {
        appUUID: expectedUUID,
      },
    });
    expect(configFile.appUUID).toEqual(expectedUUID);
  });

  it('defaults build targets to an empty array', () => {
    const configFile = config.normalizeProjectConfig({});
    expect(configFile.buildTargets).toHaveLength(0);
  });
});
