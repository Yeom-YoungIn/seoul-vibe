export default function AdminUsersPage() {
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">
          Users <span className="admin-count">N/A</span>
        </h1>
      </header>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Unavailable</td>
              <td>User admin API is not implemented on the server yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
