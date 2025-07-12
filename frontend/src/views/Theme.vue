<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 mb-6 text-center">theme </h1>
        <p class="text-h6 text-center text-medium-emphasis mb-8">
          Explore the beautiful dark blue gradient theme with vibrant accents
        </p>
      </v-col>
    </v-row>

    <!-- Color Palette Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Color Palette</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Primary Colors</h3>
                <div class="d-flex flex-wrap gap-4 mb-6">
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-primary)"></div>
                    <small>Primary</small>
                    <small class="text-caption">#4299E1</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-primary-dark)"></div>
                    <small>Primary Dark</small>
                    <small class="text-caption">#2B6CB0</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-primary-light)"></div>
                    <small>Primary Light</small>
                    <small class="text-caption">#63B3ED</small>
                  </div>
                </div>
                
                <h3 class="mb-4">Secondary Colors</h3>
                <div class="d-flex flex-wrap gap-4 mb-6">
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-secondary)"></div>
                    <small>Secondary</small>
                    <small class="text-caption">#805AD5</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-accent)"></div>
                    <small>Accent</small>
                    <small class="text-caption">#ED8936</small>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Semantic Colors</h3>
                <div class="d-flex flex-wrap gap-4 mb-6">
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-success)"></div>
                    <small>Success</small>
                    <small class="text-caption">#48BB78</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-warning)"></div>
                    <small>Warning</small>
                    <small class="text-caption">#F6AD55</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-error)"></div>
                    <small>Error</small>
                    <small class="text-caption">#FC8181</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box" style="background-color: var(--color-info)"></div>
                    <small>Info</small>
                    <small class="text-caption">#63B3ED</small>
                  </div>
                </div>
                
                <h3 class="mb-4">Neutral Colors</h3>
                <div class="d-flex flex-wrap gap-4">
                  <div v-for="shade in neutralShades" :key="shade" class="color-swatch">
                    <div class="color-box" :style="{ backgroundColor: getGrayValue(shade) }"></div>
                    <small>Gray {{ shade }}</small>
                    <small class="text-caption">{{ getGrayValue(shade) }}</small>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Buttons Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Buttons</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Filled Buttons</h3>
                <div class="d-flex flex-wrap gap-4 mb-6">
                  <v-btn color="primary">Primary</v-btn>
                  <v-btn color="secondary">Secondary</v-btn>
                  <v-btn color="success">Success</v-btn>
                  <v-btn color="error">Error</v-btn>
                  <v-btn color="warning">Warning</v-btn>
                  <v-btn color="info">Info</v-btn>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Outlined Buttons</h3>
                <div class="d-flex flex-wrap gap-4 mb-6">
                  <v-btn variant="outlined" color="primary">Primary</v-btn>
                  <v-btn variant="outlined" color="secondary">Secondary</v-btn>
                  <v-btn variant="outlined" color="success">Success</v-btn>
                  <v-btn variant="outlined" color="error">Error</v-btn>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Text Buttons</h3>
                <div class="d-flex flex-wrap gap-4 mb-6">
                  <v-btn variant="text" color="primary">Primary</v-btn>
                  <v-btn variant="text" color="secondary">Secondary</v-btn>
                  <v-btn variant="text" color="success">Success</v-btn>
                  <v-btn variant="text" color="error">Error</v-btn>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Floating Action Buttons</h3>
                <div class="d-flex flex-wrap gap-4">
                  <v-btn icon color="primary">
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                  <v-btn icon color="secondary">
                    <v-icon>mdi-heart</v-icon>
                  </v-btn>
                  <v-btn icon color="success">
                    <v-icon>mdi-check</v-icon>
                  </v-btn>
                  <v-btn icon color="error">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Cards Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Cards</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-card elevation="2">
                  <v-card-title>Basic Card</v-card-title>
                  <v-card-text>
                    This is a basic card with default styling using the new theme colors.
                  </v-card-text>
                  <v-card-actions>
                    <v-btn color="primary">Action</v-btn>
                    <v-btn variant="text">Cancel</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card elevation="8" class="gradient-card">
                  <v-card-title class="text-white">Gradient Card</v-card-title>
                  <v-card-text class="text-white">
                    This card uses a gradient background for a more dynamic look.
                  </v-card-text>
                  <v-card-actions>
                    <v-btn color="white" variant="outlined">Action</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card color="surface-variant" elevation="4">
                  <v-card-title>Surface Variant</v-card-title>
                  <v-card-text>
                    This card uses the surface-variant color for subtle differentiation.
                  </v-card-text>
                  <v-card-actions>
                    <v-btn color="secondary">Action</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Form Components Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Form Components</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Text Field"
                  placeholder="Enter text here"
                  color="primary"
                  class="mb-4"
                ></v-text-field>
                
                <v-text-field
                  label="Outlined Text Field"
                  placeholder="Enter text here"
                  variant="outlined"
                  color="secondary"
                  class="mb-4"
                ></v-text-field>

                <v-select
                  label="Select"
                  :items="['Option 1', 'Option 2', 'Option 3']"
                  color="primary"
                  class="mb-4"
                ></v-select>

                <v-textarea
                  label="Textarea"
                  placeholder="Enter multiple lines here"
                  color="primary"
                  rows="3"
                  class="mb-4"
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  label="Checkbox"
                  color="primary"
                  class="mb-2"
                ></v-checkbox>
                
                <v-checkbox
                  label="Secondary Checkbox"
                  color="secondary"
                  class="mb-4"
                ></v-checkbox>

                <v-radio-group color="primary" class="mb-4">
                  <v-radio label="Radio Option 1" value="1"></v-radio>
                  <v-radio label="Radio Option 2" value="2"></v-radio>
                </v-radio-group>

                <v-switch
                  label="Switch"
                  color="primary"
                  class="mb-2"
                ></v-switch>
                
                <v-switch
                  label="Secondary Switch"
                  color="secondary"
                  class="mb-4"
                ></v-switch>

                <v-slider
                  label="Slider"
                  color="primary"
                  thumb-label
                  class="mb-4"
                ></v-slider>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Progress & Loading Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Progress & Loading</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Progress Bars</h3>
                <v-progress-linear
                  v-model="progressValue"
                  color="primary"
                  height="8"
                  class="mb-4"
                ></v-progress-linear>

                <v-progress-linear
                  v-model="progressValue"
                  color="secondary"
                  height="8"
                  class="mb-4"
                ></v-progress-linear>

                <v-progress-linear
                  indeterminate
                  color="info"
                  height="8"
                  class="mb-4"
                ></v-progress-linear>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Progress Circles</h3>
                <div class="d-flex gap-4 align-center mb-4">
                  <v-progress-circular
                    :model-value="progressValue"
                    color="primary"
                    size="64"
                  >
                    {{ Math.round(progressValue) }}%
                  </v-progress-circular>

                  <v-progress-circular
                    indeterminate
                    color="secondary"
                    size="48"
                  ></v-progress-circular>

                  <v-progress-circular
                    indeterminate
                    color="info"
                    size="32"
                  ></v-progress-circular>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Typography Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Typography</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Font Sizes</h3>
                <div class="typography-samples">
                  <div class="type-sample" style="font-size: var(--font-5xl)">
                    5xl - 3rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-4xl)">
                    4xl - 2.25rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-3xl)">
                    3xl - 1.875rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-2xl)">
                    2xl - 1.5rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-xl)">
                    xl - 1.25rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-lg)">
                    lg - 1.125rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-base)">
                    base - 1rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-sm)">
                    sm - 0.875rem - The quick brown fox
                  </div>
                  <div class="type-sample" style="font-size: var(--font-xs)">
                    xs - 0.75rem - The quick brown fox
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Font Weights</h3>
                <div class="typography-samples">
                  <div class="type-sample" style="font-weight: var(--font-normal)">
                    Normal (400) - The quick brown fox jumps over the lazy dog
                  </div>
                  <div class="type-sample" style="font-weight: var(--font-medium)">
                    Medium (500) - The quick brown fox jumps over the lazy dog
                  </div>
                  <div class="type-sample" style="font-weight: var(--font-semibold)">
                    Semibold (600) - The quick brown fox jumps over the lazy dog
                  </div>
                  <div class="type-sample" style="font-weight: var(--font-bold)">
                    Bold (700) - The quick brown fox jumps over the lazy dog
                  </div>
                  <div class="type-sample" style="font-weight: var(--font-extrabold)">
                    Extrabold (800) - The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Chips & Badges Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Chips & Badges</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Chips</h3>
                <div class="d-flex flex-wrap gap-2 mb-4">
                  <v-chip color="primary">Primary Chip</v-chip>
                  <v-chip color="secondary">Secondary Chip</v-chip>
                  <v-chip color="success">Success Chip</v-chip>
                  <v-chip color="error">Error Chip</v-chip>
                  <v-chip color="warning">Warning Chip</v-chip>
                  <v-chip color="info">Info Chip</v-chip>
                </div>
                <div class="d-flex flex-wrap gap-2 mb-4">
                  <v-chip variant="outlined" color="primary">Outlined</v-chip>
                  <v-chip variant="outlined" color="secondary">Outlined</v-chip>
                  <v-chip variant="text" color="primary">Text</v-chip>
                  <v-chip variant="text" color="secondary">Text</v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Badges</h3>
                <div class="d-flex gap-4 align-center mb-4">
                  <v-badge content="6" color="primary">
                    <v-btn icon>
                      <v-icon>mdi-email</v-icon>
                    </v-btn>
                  </v-badge>

                  <v-badge content="99+" color="secondary">
                    <v-btn icon>
                      <v-icon>mdi-bell</v-icon>
                    </v-btn>
                  </v-badge>

                  <v-badge dot color="error">
                    <v-btn icon>
                      <v-icon>mdi-account</v-icon>
                    </v-btn>
                  </v-badge>

                  <v-badge content="New" color="success">
                    <v-btn icon>
                      <v-icon>mdi-message</v-icon>
                    </v-btn>
                  </v-badge>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Alerts & Snackbars Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Alerts & Notifications</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <h3 class="mb-4">Alerts</h3>
                <v-alert
                  type="success"
                  title="Success Alert"
                  text="This is a success alert with the new theme colors."
                  class="mb-4"
                ></v-alert>

                <v-alert
                  type="info"
                  title="Info Alert"
                  text="This is an info alert showcasing the beautiful blue theme."
                  class="mb-4"
                ></v-alert>

                <v-alert
                  type="warning"
                  title="Warning Alert"
                  text="This is a warning alert with proper contrast."
                  class="mb-4"
                ></v-alert>

                <v-alert
                  type="error"
                  title="Error Alert"
                  text="This is an error alert with clear visibility."
                  class="mb-4"
                ></v-alert>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <h3 class="mb-4">Snackbar Demo</h3>
                <div class="d-flex gap-4">
                  <v-btn @click="showSnackbar('success')" color="success">Show Success</v-btn>
                  <v-btn @click="showSnackbar('error')" color="error">Show Error</v-btn>
                  <v-btn @click="showSnackbar('info')" color="info">Show Info</v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Attribute Bars Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Attribute Bars</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <h3 class="mb-4">Single Player Attributes</h3>
                
                <!-- Physical Attributes -->
                <div class="attributes-group">
                  <h4 class="attributes-category">Physical</h4>
                  <div class="attributes-grid">
                    <div v-for="attr in physicalAttributes" :key="attr.name" class="attribute-item">
                      <span class="attr-label">{{ attr.label }}</span>
                      <div class="attr-bar">
                        <div class="attr-fill" :style="`width: ${attr.value}%`"></div>
                      </div>
                      <span class="attr-value">{{ attr.value }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Mental Attributes -->
                <div class="attributes-group">
                  <h4 class="attributes-category">Mental</h4>
                  <div class="attributes-grid">
                    <div v-for="attr in mentalAttributes" :key="attr.name" class="attribute-item">
                      <span class="attr-label">{{ attr.label }}</span>
                      <div class="attr-bar">
                        <div class="attr-fill" :style="`width: ${attr.value}%`"></div>
                      </div>
                      <span class="attr-value">{{ attr.value }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Technical Attributes -->
                <div class="attributes-group">
                  <h4 class="attributes-category">Technical</h4>
                  <div class="attributes-grid">
                    <div v-for="attr in technicalAttributes" :key="attr.name" class="attribute-item">
                      <span class="attr-label">{{ attr.label }}</span>
                      <div class="attr-bar">
                        <div class="attr-fill" :style="`width: ${attr.value}%`"></div>
                      </div>
                      <span class="attr-value">{{ attr.value }}</span>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-6"></v-divider>
            
            <v-row>
              <v-col cols="12">
                <h3 class="mb-4">Head-to-Head Comparison</h3>
                
                <div class="h2h-comparison">
                  <div class="h2h-header">
                    <div class="h2h-player home">
                      <span class="h2h-name">Home Player</span>
                      <span class="h2h-overall">OVR 85</span>
                    </div>
                    <div class="h2h-vs">VS</div>
                    <div class="h2h-player away">
                      <span class="h2h-name">Away Player</span>
                      <span class="h2h-overall">OVR 82</span>
                    </div>
                  </div>
                  
                  <div class="h2h-attributes">
                    <div v-for="attr in h2hAttributes" :key="attr.name" class="h2h-attribute">
                      <div class="h2h-values">
                        <span class="h2h-value home">{{ attr.home }}</span>
                        <span class="h2h-label">{{ attr.label }}</span>
                        <span class="h2h-value away">{{ attr.away }}</span>
                      </div>
                      <div class="h2h-bars">
                        <div class="h2h-bar-container home">
                          <div class="h2h-bar home" :style="`width: ${getComparisonWidth(attr.home, attr.away, 'home')}%`"></div>
                        </div>
                        <div class="h2h-bar-container away">
                          <div class="h2h-bar away" :style="`width: ${getComparisonWidth(attr.home, attr.away, 'away')}%`"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-6"></v-divider>
            
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Team Stats</h3>
                
                <div class="team-stats">
                  <div v-for="stat in teamStats" :key="stat.name" class="team-stat">
                    <span class="stat-label">{{ stat.label }}</span>
                    <div class="stat-bar">
                      <div class="stat-fill" :style="`width: ${stat.value}%`"></div>
                    </div>
                    <span class="stat-value">{{ stat.value }}</span>
                  </div>
                </div>
              </v-col>
              
              <v-col cols="12" md="6">
                <h3 class="mb-4">In-Game Status Bars</h3>
                
                <div class="status-bars">
                  <div class="status-item">
                    <span class="status-label">Health</span>
                    <div class="status-bar health">
                      <div class="status-fill" :style="`width: 75%`"></div>
                    </div>
                    <span class="status-value">75%</span>
                  </div>
                  
                  <div class="status-item">
                    <span class="status-label">Stamina (High)</span>
                    <div class="status-bar stamina">
                      <div class="status-fill high" :style="`width: 85%`"></div>
                    </div>
                    <span class="status-value">85%</span>
                  </div>
                  
                  <div class="status-item">
                    <span class="status-label">Stamina (Low)</span>
                    <div class="status-bar stamina">
                      <div class="status-fill low" :style="`width: 25%`"></div>
                    </div>
                    <span class="status-value">25%</span>
                  </div>
                  
                  <div class="status-item">
                    <span class="status-label">Skill Cooldown</span>
                    <div class="status-bar cooldown">
                      <div class="status-fill" :style="`width: 40%`"></div>
                    </div>
                    <span class="status-value">2.4s</span>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Effects Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Effects</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Shadows</h3>
                <div class="effects-grid">
                  <div class="effect-box shadow-sm">Small Shadow</div>
                  <div class="effect-box shadow-base">Base Shadow</div>
                  <div class="effect-box shadow-md">Medium Shadow</div>
                  <div class="effect-box shadow-lg">Large Shadow</div>
                  <div class="effect-box shadow-xl">XL Shadow</div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Animations</h3>
                <div class="effects-grid">
                  <div class="effect-box animation-pulse">Pulse</div>
                  <div class="effect-box animation-bounce">Bounce</div>
                  <div class="effect-box animation-spin">Spin</div>
                  <div class="effect-box animation-ping">Ping</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Spacing Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Spacing Scale</v-card-title>
          <v-card-text>
            <div class="spacing-grid">
              <div v-for="space in spacingScale" :key="space.name" class="spacing-item">
                <div class="spacing-box" :style="`width: var(--space-${space.name}); height: var(--space-${space.name})`"></div>
                <span class="spacing-label">{{ space.name }} - {{ space.value }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Navigation & Tabs Section -->
    <v-row class="mb-8">
      <v-col cols="12">
        <v-card class="mb-6">
          <v-card-title class="text-h4">Navigation & Tabs</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Tabs</h3>
                <v-tabs v-model="activeTab" color="primary" class="mb-4">
                  <v-tab value="tab1">Tab One</v-tab>
                  <v-tab value="tab2">Tab Two</v-tab>
                  <v-tab value="tab3">Tab Three</v-tab>
                </v-tabs>

                <v-tabs-window v-model="activeTab">
                  <v-tabs-window-item value="tab1">
                    <v-card flat>
                      <v-card-text>Content for Tab One</v-card-text>
                    </v-card>
                  </v-tabs-window-item>
                  <v-tabs-window-item value="tab2">
                    <v-card flat>
                      <v-card-text>Content for Tab Two</v-card-text>
                    </v-card>
                  </v-tabs-window-item>
                  <v-tabs-window-item value="tab3">
                    <v-card flat>
                      <v-card-text>Content for Tab Three</v-card-text>
                    </v-card>
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Breadcrumbs</h3>
                <v-breadcrumbs
                  :items="breadcrumbItems"
                  class="mb-4"
                >
                  <template v-slot:divider>
                    <v-icon>mdi-chevron-right</v-icon>
                  </template>
                </v-breadcrumbs>

                <h3 class="mb-4">Pagination</h3>
                <v-pagination
                  v-model="currentPage"
                  :length="6"
                  color="primary"
                  class="mb-4"
                ></v-pagination>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Snackbar Component -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'

const progressValue = ref(0)
const activeTab = ref('tab1')
const currentPage = ref(1)

const breadcrumbItems = ref([
  { title: 'Home', disabled: false, href: '/' },
  { title: 'Theme', disabled: false, href: '/theme' },
  { title: 'Showcase', disabled: true }
])

// Attribute data for bars
const physicalAttributes = ref([
  { name: 'pace', label: 'Pace', value: 85 },
  { name: 'acceleration', label: 'Acceleration', value: 82 },
  { name: 'stamina', label: 'Stamina', value: 78 },
  { name: 'strength', label: 'Strength', value: 75 },
  { name: 'agility', label: 'Agility', value: 88 },
  { name: 'balance', label: 'Balance', value: 84 }
])

const mentalAttributes = ref([
  { name: 'anticipation', label: 'Anticipation', value: 72 },
  { name: 'decisions', label: 'Decisions', value: 78 },
  { name: 'positioning', label: 'Positioning', value: 85 },
  { name: 'composure', label: 'Composure', value: 80 },
  { name: 'concentration', label: 'Concentration', value: 76 },
  { name: 'workRate', label: 'Work Rate', value: 88 },
  { name: 'determination', label: 'Determination', value: 92 },
  { name: 'teamwork', label: 'Teamwork', value: 74 },
  { name: 'vision', label: 'Vision', value: 83 }
])

const technicalAttributes = ref([
  { name: 'passing', label: 'Passing', value: 76 },
  { name: 'technique', label: 'Technique', value: 81 },
  { name: 'dribbling', label: 'Dribbling', value: 87 },
  { name: 'firstTouch', label: 'First Touch', value: 83 },
  { name: 'tackling', label: 'Tackling', value: 45 },
  { name: 'marking', label: 'Marking', value: 42 },
  { name: 'finishing', label: 'Finishing', value: 88 },
  { name: 'heading', label: 'Heading', value: 78 },
  { name: 'crossing', label: 'Crossing', value: 72 },
  { name: 'freekick', label: 'Free Kick', value: 68 },
  { name: 'curve', label: 'Curve', value: 74 },
  { name: 'volleys', label: 'Volleys', value: 82 },
  { name: 'penalties', label: 'Penalties', value: 85 },
  { name: 'offTheBall', label: 'Off The Ball', value: 86 }
])

const h2hAttributes = ref([
  { name: 'pace', label: 'Pace', home: 85, away: 78 },
  { name: 'shooting', label: 'Shooting', home: 88, away: 82 },
  { name: 'passing', label: 'Passing', home: 76, away: 84 },
  { name: 'dribbling', label: 'Dribbling', home: 87, away: 81 },
  { name: 'defense', label: 'Defense', home: 45, away: 72 },
  { name: 'physical', label: 'Physical', home: 82, away: 86 }
])

const teamStats = ref([
  { name: 'overall', label: 'Overall', value: 83 },
  { name: 'attack', label: 'Attack', value: 88 },
  { name: 'defense', label: 'Defense', value: 76 },
  { name: 'speed', label: 'Speed', value: 85 },
  { name: 'physical', label: 'Physical', value: 82 },
  { name: 'mental', label: 'Mental', value: 79 }
])

// Helper function for head-to-head comparison
const getComparisonWidth = (homeValue, awayValue, side) => {
  const total = homeValue + awayValue
  if (total === 0) return 50
  
  if (side === 'home') {
    return (homeValue / total) * 100
  } else {
    return (awayValue / total) * 100
  }
}

const spacingScale = ref([
  { name: '1', value: '0.25rem' },
  { name: '2', value: '0.5rem' },
  { name: '3', value: '0.75rem' },
  { name: '4', value: '1rem' },
  { name: '5', value: '1.25rem' },
  { name: '6', value: '1.5rem' },
  { name: '8', value: '2rem' },
  { name: '10', value: '2.5rem' },
  { name: '12', value: '3rem' },
  { name: '16', value: '4rem' }
])

const neutralShades = ref(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'])

// Helper function for gray values
const getGrayValue = (shade) => {
  const values = {
    '50': '#F7FAFC',
    '100': '#EDF2F7',
    '200': '#E2E8F0',
    '300': '#CBD5E0',
    '400': '#A0AEC0',
    '500': '#718096',
    '600': '#4A5568',
    '700': '#2D3748',
    '800': '#1A202C',
    '900': '#171923'
  }
  return values[shade] || '#000000'
}

const snackbar = reactive({
  show: false,
  text: '',
  color: 'primary'
})

const showSnackbar = (type) => {
  const messages = {
    success: 'Success! Operation completed successfully.',
    error: 'Error! Something went wrong.',
    info: 'Info! Here\'s some information for you.'
  }

  snackbar.text = messages[type] || 'Notification'
  snackbar.color = type
  snackbar.show = true
}

onMounted(() => {
  // Animate progress value
  const interval = setInterval(() => {
    progressValue.value += 1
    if (progressValue.value >= 100) {
      progressValue.value = 0
    }
  }, 100)

  // Clean up interval when component is unmounted
  return () => clearInterval(interval)
})
</script>

<style scoped>
/* CSS Variables from StyleGuideView */
:root {
  /* Font Sizes */
  --font-5xl: 3rem;
  --font-4xl: 2.25rem;
  --font-3xl: 1.875rem;
  --font-2xl: 1.5rem;
  --font-xl: 1.25rem;
  --font-lg: 1.125rem;
  --font-base: 1rem;
  --font-sm: 0.875rem;
  --font-xs: 0.75rem;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  
  /* Colors */
  --color-primary: #4299E1;
  --color-primary-dark: #2B6CB0;
  --color-primary-light: #63B3ED;
  --color-secondary: #805AD5;
  --color-secondary-dark: #6B46C1;
  --color-accent: #ED8936;
  --color-accent-dark: #DD6B20;
  --color-success: #48BB78;
  --color-warning: #F6AD55;
  --color-error: #FC8181;
  --color-info: #63B3ED;
  
  /* Surface Colors */
  --bg-primary: #0a0e27;
  --bg-secondary: #151932;
  --bg-tertiary: #1e2341;
  --bg-card: #1e2341;
  --text-primary: #ffffff;
  --text-secondary: #a0aec0;
  --text-tertiary: #718096;
  
  /* Borders */
  --border-default: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-base: 0.2s;
  
  /* Glass effect */
  --glass-bg: rgba(30, 35, 65, 0.5);
  --glass-blur: blur(10px);
  --glass-border: rgba(255, 255, 255, 0.1);
}

.color-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.color-box {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.gradient-card {
  background: linear-gradient(135deg, #4A90E2 0%, #2E5BBA 100%);
}

/* Typography samples */
.typography-samples {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.type-sample {
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all var(--transition-base) ease;
}

.type-sample:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-hover);
}

/* Attribute Bars */
.attributes-group {
  margin-bottom: var(--space-8);
}

.attributes-category {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-3);
}

.attribute-item {
  display: grid;
  grid-template-columns: 120px 1fr 40px;
  align-items: center;
  gap: var(--space-3);
}

.attr-label {
  font-size: var(--font-sm);
  color: var(--text-secondary);
  text-align: right;
}

.attr-bar {
  width: 100%;
  height: 6px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.attr-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
  transition: width 0.3s ease;
}

.attr-value {
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

/* Head-to-Head Comparison */
.h2h-comparison {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
}

.h2h-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-default);
}

.h2h-player {
  text-align: center;
}

.h2h-player.home {
  text-align: right;
}

.h2h-player.away {
  text-align: left;
}

.h2h-name {
  display: block;
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-1);
}

.h2h-overall {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
}

.h2h-vs {
  padding: 0 var(--space-6);
  font-weight: var(--font-bold);
  color: var(--text-tertiary);
}

.h2h-attributes {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.h2h-attribute {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.h2h-values {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center;
  gap: var(--space-4);
}

.h2h-value {
  font-weight: var(--font-medium);
  font-size: var(--font-sm);
}

.h2h-value.home {
  text-align: right;
  color: #3b82f6;
}

.h2h-value.away {
  text-align: left;
  color: #ef4444;
}

.h2h-label {
  text-align: center;
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.h2h-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
  height: 8px;
}

.h2h-bar-container {
  background: rgba(100, 116, 139, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.h2h-bar-container.home {
  direction: rtl;
}

.h2h-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.h2h-bar.home {
  background: #3b82f6;
}

.h2h-bar.away {
  background: #ef4444;
}

/* Team Stats */
.team-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

.team-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stat-label {
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.stat-bar {
  width: 100%;
  height: 8px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
  transition: width 0.3s ease;
}

.stat-value {
  font-size: var(--font-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* In-Game Status Bars */
.status-bars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-6);
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.status-label {
  font-size: var(--font-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.status-bar {
  width: 100%;
  height: 10px;
  background: rgba(100, 116, 139, 0.2);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.status-bar.health .status-fill {
  background: #ef4444;
}

.status-bar.stamina .status-fill.high {
  background: #10b981;
}

.status-bar.stamina .status-fill.low {
  background: #ef4444;
}

.status-bar.cooldown .status-fill {
  background: #3b82f6;
}

.status-fill {
  height: 100%;
  transition: width 0.3s ease;
  position: relative;
}

.status-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.status-value {
  font-size: var(--font-sm);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
}

/* Effects Grid */
.effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-6);
}

.effect-box {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  transition: all var(--transition-base) ease;
}

.effect-box:hover {
  transform: translateY(-2px);
}

/* Shadow effects */
.shadow-sm {
  box-shadow: var(--shadow-sm);
}

.shadow-base {
  box-shadow: var(--shadow-base);
}

.shadow-md {
  box-shadow: var(--shadow-md);
}

.shadow-lg {
  box-shadow: var(--shadow-lg);
}

.shadow-xl {
  box-shadow: var(--shadow-xl);
}

/* Animations */
.animation-pulse {
  animation: pulse 2s infinite;
}

.animation-bounce {
  animation: bounce 1s infinite;
}

.animation-spin {
  animation: spin 2s linear infinite;
}

.animation-ping {
  position: relative;
}

.animation-ping::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  background: var(--color-primary);
  opacity: 0.75;
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-25%); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* Spacing Grid */
.spacing-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  align-items: flex-end;
}

.spacing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.spacing-box {
  background: var(--color-primary);
  border-radius: var(--radius-sm);
}

.spacing-label {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  font-family: monospace;
}
</style>
