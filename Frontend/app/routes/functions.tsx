export async function apiCall(url: string, formData: FormData | null): Promise<any> {

    if (formData != null) {
        return await fetch(url, {
            credentials: "include",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
        });
    } else {
        return await fetch(url, {credentials: "include"});
    }

}