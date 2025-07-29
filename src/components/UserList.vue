<template>
  <v-container>
    <v-row align="center">
      <v-col cols="6" md="3">
        <v-select v-model="filterField" :items="filterOptions" label="Filter by" prepend-icon="mdi-filter-outline" />
      </v-col>
      <v-col cols="6" md="3">
        <v-text-field v-model="search" label="Enter filter value" prepend-icon="mdi-magnify" />
      </v-col>
      <v-col cols="12" md="6">
        <v-select v-model="viewMode" :items="['list', 'grid']" label="View Mode" prepend-icon="mdi-view-grid" />
      </v-col>
    </v-row>
    <v-row justify="end" class="mb-4">
      <v-col cols="auto">
        <v-btn color="success" @click="openAddForm">
          <v-icon start>mdi-plus</v-icon> Add User
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="exportCSV">
          <v-icon start>mdi-download</v-icon> Export CSV
        </v-btn>
      </v-col>
    </v-row>

    <v-divider class="mb-4"></v-divider>

    <template v-if="viewMode === 'list'">
      <v-data-table :headers="headers" :items="filteredUsers" :sort-by="sortBy" :sort-desc.sync="sortDesc"
        class="elevation-1">
        <template #item.profilePicture="{ item }">
          <v-tooltip location="start" :open-on-hover="!isDefaultAvatar(item.profilePicture)">
            <template #activator="{ props }">
              <v-avatar size="40" v-bind="props">
                <v-img :src="profileSrc(item.profilePicture)" @error="onImageError" />
              </v-avatar>
            </template>
            <span>{{ extractFilename(item.profilePicture) }}</span>
          </v-tooltip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatRelativeTime(item.createdAt) }}
        </template>

        <template #item.updatedAt="{ item }">
          {{ formatRelativeTime(item.updatedAt) }}
        </template>

        <template #item.actions="{ item }">
          <v-icon small class="me-2" color="primary" @click="editUser(item)">mdi-pencil</v-icon>
          <v-icon small color="red" @click="deleteUser(item.id)">mdi-delete</v-icon>
        </template>
      </v-data-table>
    </template>

    <template v-else>
      <v-row>
        <v-col cols="12" sm="6" md="4" v-for="user in filteredUsers" :key="user.id">
          <v-card>
            <v-card-title>
              <v-tooltip location="start" :open-on-hover="!isDefaultAvatar(user.profilePicture)">
                <template #activator="{ props }">
                  <v-avatar size="48" class="me-3" v-bind="props">
                    <v-img :src="profileSrc(user.profilePicture)" @error="onImageError" />
                  </v-avatar>
                </template>
                <span>{{ extractFilename(user.profilePicture) }}</span>
              </v-tooltip>
              <div>
                <div class="text-h6">{{ user.name }}</div>
                <div class="text-caption">{{ user.email }}</div>
              </div>
            </v-card-title>

            <v-card-text>
              <div><strong>Gender:</strong> {{ user.gender }}</div>
              <div><strong>DOB:</strong> {{ user.dob }}</div>
              <div><strong>Created:</strong> {{ formatRelativeTime(user.createdAt) }}</div>
              <div><strong>Updated:</strong> {{ formatRelativeTime(user.updatedAt) }}</div>
            </v-card-text>

            <v-card-actions>
              <v-btn icon @click="editUser(user)">
                <v-icon color="primary">mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon @click="deleteUser(user.id)">
                <v-icon color="red">mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <UserForm v-model="dialog" :user-to-edit="userToEdit" @refresh="fetchUsers" />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Papa from 'papaparse'
import UserForm from './UserForm.vue'

dayjs.extend(relativeTime)

interface User {
  id: string
  name: string
  email: string
  dob: string
  gender: string
  profilePicture: string
  createdAt: string
  updatedAt: string
}

type SortItem = {
  key: string
  order?: boolean | 'asc' | 'desc'
}

const viewMode = ref<'list' | 'grid'>('list')
const users = ref<User[]>([])
const search = ref<string>('')
const sortBy = ref<SortItem[]>([
  { key: 'name', order: 'asc' } // ✅ Correct
])
const sortDesc = ref<boolean>(false)
const filterField = ref<keyof User>('name')

const filterOptions = [
  { title: 'Name', value: 'name' },
  { title: 'Email', value: 'email' },
  { title: 'DOB', value: 'dob' },
  { title: 'Gender', value: 'gender' },
  { title: 'Profile Picture', value: 'profilePicture' },
  { title: 'Created At', value: 'createdAt' },
  { title: 'Updated At', value: 'updatedAt' },
]

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'DOB', key: 'dob', sortable: true },
  { title: 'Gender', key: 'gender', sortable: true },
  { title: 'Profile Picture', key: 'profilePicture' },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Updated At', key: 'updatedAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const fetchUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'))
  users.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[]
}

const formatRelativeTime = (timestamp: string) => {
  return dayjs(timestamp).fromNow()
}

const deleteUser = async (id: string) => {
  if (confirm('Are you sure to delete this user?')) {
    await deleteDoc(doc(db, 'users', id))
    await fetchUsers()
  }
}

const exportCSV = () => {
  const csv = Papa.unparse(users.value)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', 'user-list.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const filteredUsers = computed(() => {
  if (!search.value) return users.value

  return users.value.filter(user => {
    const field = filterField.value as keyof User
    const keyword = search.value.toLowerCase()

    if (field === 'profilePicture') {
      const filename = extractFilename(user.profilePicture)
      return filename.toLowerCase().includes(keyword)
    }

    if (field === 'createdAt' || field === 'updatedAt') {
      const relativeTime = formatRelativeTime(user[field])
      return relativeTime.toLowerCase().includes(keyword)
    }

    const value = user[field]
    return value?.toString().toLowerCase().includes(keyword)
  })
})



const dialog = ref(false)
const userToEdit = ref<User | null>(null)

const openAddForm = () => {
  userToEdit.value = null
  dialog.value = true
}

const editUser = (user: User) => {
  userToEdit.value = user
  dialog.value = true
}

const fallbackImage = '/default-avatar.jpg'

const profileSrc = (src: string | undefined) => {
  return src && src.trim() !== '' ? src : fallbackImage
}

const onImageError = (src: string | undefined) => {
  // Fallback image logic – store a map or override by ID if needed
  console.warn('Image failed to load:', src)
}

const extractFilename = (url: string | undefined): string => {
  if (!url || url.trim() === '') return ''
  return url.substring(url.lastIndexOf('/') + 1)
}

const isDefaultAvatar = (url: string | undefined): boolean => {
  return !url || url.trim() === '' || profileSrc(url) === fallbackImage
}

onMounted(fetchUsers)
</script>
