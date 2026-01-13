export async function apiCall(url: string, formData: FormData | null): Promise<any> {

    if (formData != null) {
        return await fetch(url, {
            credentials: "include",
            method: "POST",
            body: formData,
        });
    } else {
        return await fetch(url, {credentials: "include"});
    }

}