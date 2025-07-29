<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card>
      <v-card-title>{{ isEdit ? 'Edit User' : 'Add User' }}</v-card-title>
      <v-card-text>
        <v-text-field v-model="form.name" label="Name" />
        <v-text-field v-model="form.email" label="Email" />
        <v-text-field v-model="form.dob" label="DOB" type="date" />
        <v-select v-model="form.gender" :items="['Male', 'Female']" label="Gender" />
        <!-- Upload Button -->
        <v-file-input
          v-model="file"
          accept="image/*"
          :label="fileInputLabel || 'Profile Picture'"
          @change="previewImage"
          :clearable="false"
        />

        <!-- Preview -->
        <v-avatar size="64" class="mt-2">
          <v-img :src="imagePreview || form.profilePicture || 'default-avatar.jpg'" />
        </v-avatar>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="submit">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-overlay :model-value="isLoading" persistent class="justify-center align-center">
    <v-progress-circular indeterminate size="64" color="primary" />
  </v-overlay>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import axios from 'axios'

interface Props {
  modelValue: boolean
  userToEdit?: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const form = ref({
  name: '',
  email: '',
  dob: '',
  gender: '',
  profilePicture: '',
})

const file = ref<File | null>(null)
const fileInputLabel = ref('')          // for v-file-input display
const imagePreview = ref('')            // for v-img preview
const isEdit = ref(false)
const isLoading = ref(false)

watch(isOpen, (val) => {
  if (val) {
    isEdit.value = !!props.userToEdit
    if (props.userToEdit) {
      form.value = { ...props.userToEdit }

      // Extract filename from profilePicture
      const url = props.userToEdit.profilePicture
      if (url) {
        const filename = url.substring(url.lastIndexOf('/') + 1)
        fileInputLabel.value = filename
        imagePreview.value = url
      } else {
        fileInputLabel.value = ''
        imagePreview.value = ''
      }
    } else {
      form.value = { name: '', email: '', dob: '', gender: '', profilePicture: '' }
      file.value = null;
      fileInputLabel.value = ''
      imagePreview.value = ''
    }
  }
})


const previewImage = () => {
  if (file.value) {
    imagePreview.value = URL.createObjectURL(file.value)
    fileInputLabel.value = file.value.name
  }
}

const close = () => emit('update:modelValue', false)

const submit = async () => {
  isLoading.value = true

  let imageUrl = form.value.profilePicture

  try {
    // Upload to Cloudinary (if new file is selected)
    if (file.value) {
      const formData = new FormData()
      const originalName = file.value!.name.replace(/\.[^/.]+$/, '') // Remove .jpg/.png/etc
      formData.append('file', file.value)
      formData.append('upload_preset', 'g2g-cloudinary-image-upload')
      formData.append('public_id', originalName)

      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dvyj9li93/image/upload',
        formData
      )

      imageUrl = response.data.secure_url
    }

    const userData = {
      ...form.value,
      profilePicture: imageUrl,
      updatedAt: new Date().toISOString(),
    }

    // 🔄 Firestore: update or add
    if (isEdit.value && props.userToEdit?.id) {
      await updateDoc(doc(db, 'users', props.userToEdit.id), userData)
    } else {
      await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: new Date().toISOString(),
      })
    }

    emit('refresh')
    close()
  } catch (err) {
    console.error('Submit failed:', err)
  } finally {
    isLoading.value = false
  }
}

</script>
