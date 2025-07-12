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
                    <div class="color-box bg-primary"></div>
                    <small>Primary</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-secondary"></div>
                    <small>Secondary</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-success"></div>
                    <small>Success</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-error"></div>
                    <small>Error</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-warning"></div>
                    <small>Warning</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-info"></div>
                    <small>Info</small>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <h3 class="mb-4">Surface Colors</h3>
                <div class="d-flex flex-wrap gap-4">
                  <div class="color-swatch">
                    <div class="color-box bg-surface"></div>
                    <small>Surface</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-surface-variant"></div>
                    <small>Surface Variant</small>
                  </div>
                  <div class="color-swatch">
                    <div class="color-box bg-surface-bright"></div>
                    <small>Surface Bright</small>
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
</style>
