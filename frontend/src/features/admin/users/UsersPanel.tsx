import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../../lib/api'
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  type AdminUser,
  type UserRole,
} from './usersApi'
import './UsersPanel.css'

type UsersPanelProps = {
  token: string
  currentUserId: number
}

type UserFormState = {
  name: string
  email: string
  password: string
  phone: string
  rol: UserRole
  active: boolean
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  password: '',
  phone: '',
  rol: 'cliente',
  active: true,
}

const roleLabels: Record<UserRole, string> = {
  cliente: 'Cliente',
  admin: 'Admin',
  repartidor: 'Repartidor',
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return 'Ya existe un usuario con ese correo.'
  }

  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permisos para administrar usuarios.'
  }

  return 'No pudimos completar la accion de usuarios.'
}

export function UsersPanel({ token, currentUserId }: UsersPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [roleFilter, setRoleFilter] = useState<UserRole | 'todos'>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredUsers = users.filter((user) =>
    roleFilter === 'todos' ? true : user.rol === roleFilter,
  )

  const deliveryPeopleCount = users.filter((user) => user.rol === 'repartidor').length
  const activeUsersCount = users.filter((user) => user.active).length

  async function loadUsers() {
    const usersData = await getUsers(token)
    setUsers(usersData)
  }

  useEffect(() => {
    let ignore = false

    async function loadInitialUsers() {
      setIsLoading(true)
      setError(null)

      try {
        const usersData = await getUsers(token)
        if (!ignore) {
          setUsers(usersData)
        }
      } catch (loadError) {
        if (!ignore) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadInitialUsers()

    return () => {
      ignore = true
    }
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (editingUser) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          rol: form.rol,
          active: form.active,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        }

        await updateUser(editingUser.id, payload, token)
      } else {
        await createUser(
          {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password.trim(),
            phone: form.phone.trim() || null,
            rol: form.rol,
            active: form.active,
          },
          token,
        )
      }

      await loadUsers()
      setForm(emptyForm)
      setEditingUser(null)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(user: AdminUser) {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone ?? '',
      rol: user.rol,
      active: user.active,
    })
  }

  function handleCancelEdit() {
    setEditingUser(null)
    setForm(emptyForm)
  }

  async function handleToggleActive(user: AdminUser) {
    setError(null)

    try {
      const updatedUser = await updateUser(user.id, { active: !user.active }, token)
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser,
        ),
      )
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    }
  }

  async function handleDelete(user: AdminUser) {
    const shouldDelete = window.confirm(`Eliminar usuario "${user.name}"?`)
    if (!shouldDelete) {
      return
    }

    setError(null)

    try {
      await deleteUser(user.id, token)
      setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id))

      if (editingUser?.id === user.id) {
        handleCancelEdit()
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  const canSubmit =
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    (editingUser !== null || form.password.trim().length > 0)

  return (
    <section id="usuarios" className="users-panel" aria-labelledby="users-title">
      <div className="users-panel__header">
        <div>
          <p className="admin-kicker">Equipo</p>
          <h2 id="users-title">Usuarios</h2>
        </div>
        <div className="users-panel__metrics">
          <span>{activeUsersCount} activos</span>
          <span>{deliveryPeopleCount} repartidores</span>
        </div>
      </div>

      {error && <p className="users-error">{error}</p>}

      <div className="users-panel__grid">
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h3>

          <label>
            Nombre
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nombre completo"
            />
          </label>

          <label>
            Correo
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="usuario@example.com"
            />
          </label>

          <label>
            Password {editingUser ? '(opcional)' : ''}
            <input
              required={!editingUser}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={editingUser ? 'Dejar vacio para no cambiar' : 'Password inicial'}
            />
          </label>

          <label>
            Telefono
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="555-0000"
            />
          </label>

          <div className="user-form__row">
            <label>
              Rol
              <select
                value={form.rol}
                onChange={(event) => setForm({ ...form, rol: event.target.value as UserRole })}
              >
                <option value="cliente">Cliente</option>
                <option value="repartidor">Repartidor</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label className="user-check">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />
              Activo
            </label>
          </div>

          <div className="user-form__actions">
            {editingUser && (
              <button type="button" className="button-secondary" onClick={handleCancelEdit}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={!canSubmit || isSaving}>
              {isSaving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>

        <div className="users-list-wrap">
          <div className="users-filter" aria-label="Filtro de usuarios">
            {(['todos', 'cliente', 'repartidor', 'admin'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={roleFilter === filter ? 'users-filter__active' : ''}
                onClick={() => setRoleFilter(filter)}
              >
                {filter === 'todos' ? 'Todos' : roleLabels[filter]}
              </button>
            ))}
          </div>

          <div className="users-list">
            {isLoading && <p className="users-empty">Cargando usuarios...</p>}

            {!isLoading && filteredUsers.length === 0 && (
              <p className="users-empty">No hay usuarios para este filtro.</p>
            )}

            {!isLoading &&
              filteredUsers.map((user) => (
                <article key={user.id} className="user-card">
                  <div>
                    <span className={`user-role user-role--${user.rol}`}>{roleLabels[user.rol]}</span>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <small>{user.phone || 'Sin telefono'}</small>
                  </div>

                  <div className="user-card__status">
                    <strong>{user.active ? 'Activo' : 'Inactivo'}</strong>
                    {user.id === currentUserId && <span>Sesion actual</span>}
                  </div>

                  <div className="user-card__actions">
                    <button type="button" onClick={() => handleEdit(user)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      disabled={user.id === currentUserId}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      disabled={user.id === currentUserId}
                      onClick={() => handleDelete(user)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}
